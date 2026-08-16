import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function createService(initialTasks = []) {

    let tasks = initialTasks.map(
        task => new Task(task)
    );

    const repository = {

        getAll() {
            return [...tasks];
        },

        getById(id) {
            return tasks.find(task => task.id === id) ?? null;
        },

        add(data) {
            const task = new Task(data);
            tasks.push(task);
            return task;
        },

        update(task) {
            tasks = tasks.map(
                current =>
                    current.id === task.id
                        ? task
                        : current
            );
        },

        updateMany(updatedTasks) {
            const replacements = new Map(
                updatedTasks.map(task => [task.id, task])
            );
            tasks = tasks.map(
                task => replacements.get(task.id) ?? task
            );
        }

    };

    return new TaskService(repository);

}

test("una nueva subtarea hereda los objetivos de su padre", () => {

    const service = createService([{
        id: "project",
        title: "Publicar libro",
        status: TaskStatus.PENDING,
        isProject: true,
        goalIds: ["goal-book"]
    }]);

    const subtask = service.createSubtask(
        "project",
        "Corregir capítulo"
    );

    assert.deepEqual(
        subtask.goalIds,
        ["goal-book"]
    );

});

test("el editor completo suma los objetivos del padre a los elegidos", () => {

    const service = createService([{
        id: "project",
        title: "Publicar libro",
        status: TaskStatus.PENDING,
        isProject: true,
        goalIds: ["goal-book", "goal-shared"]
    }]);

    const subtask = service.createTask({
        title: "Diseñar tapa",
        status: TaskStatus.PENDING,
        parentTaskId: "project",
        goalIds: ["goal-shared", "goal-design"]
    });

    assert.deepEqual(
        subtask.goalIds,
        [
            "goal-book",
            "goal-shared",
            "goal-design"
        ]
    );

});

test("asociar un objetivo a un proyecto lo suma a todo el subárbol", () => {

    const service = createService([
        {
            id: "project",
            title: "Publicar libro",
            status: TaskStatus.PENDING,
            isProject: true,
            goalIds: ["goal-existing"]
        },
        {
            id: "chapter",
            title: "Corregir capítulo",
            status: TaskStatus.PENDING,
            parentTaskId: "project",
            isProject: true,
            goalIds: ["goal-chapter"]
        },
        {
            id: "footnotes",
            title: "Revisar notas",
            status: TaskStatus.PENDING,
            parentTaskId: "chapter",
            goalIds: []
        }
    ]);

    service.updateTask("project", {
        goalIds: [
            "goal-existing",
            "goal-new"
        ]
    });

    assert.deepEqual(
        service.getTaskById("chapter").goalIds,
        ["goal-chapter", "goal-new"]
    );
    assert.deepEqual(
        service.getTaskById("footnotes").goalIds,
        ["goal-new"]
    );

});

test("quitar un objetivo del proyecto no lo quita de sus descendientes", () => {

    const service = createService([
        {
            id: "project",
            title: "Publicar libro",
            status: TaskStatus.PENDING,
            isProject: true,
            goalIds: ["goal-book"]
        },
        {
            id: "chapter",
            title: "Corregir capítulo",
            status: TaskStatus.PENDING,
            parentTaskId: "project",
            goalIds: ["goal-book", "goal-manual"]
        }
    ]);

    service.updateTask("project", {
        goalIds: []
    });

    assert.deepEqual(
        service.getTaskById("chapter").goalIds,
        ["goal-book", "goal-manual"]
    );

});

test("la asociación masiva a un proyecto también alcanza su subárbol", () => {

    const service = createService([
        {
            id: "project",
            title: "Publicar libro",
            status: TaskStatus.PENDING,
            isProject: true
        },
        {
            id: "chapter",
            title: "Corregir capítulo",
            status: TaskStatus.PENDING,
            parentTaskId: "project",
            goalIds: ["goal-manual"]
        }
    ]);

    service.updateTasks(
        ["project"],
        {},
        {
            addGoalIds: ["goal-book"]
        }
    );

    assert.deepEqual(
        service.getTaskById("chapter").goalIds,
        ["goal-manual", "goal-book"]
    );

});
