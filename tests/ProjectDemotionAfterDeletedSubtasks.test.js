import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function createRepository(tasks) {

    return {

        getAll() {
            return tasks;
        },

        getById(id) {
            return tasks.find(task => task.id === id) ?? null;
        },

        update(task) {
            const index = tasks.findIndex(item => item.id === task.id);
            if (index !== -1) tasks[index] = task;
            return task;
        }

    };

}

test("permite convertir un proyecto en tarea simple cuando sólo conserva subtareas borradas", () => {

    const project = new Task({
        id: "project",
        title: "Proyecto",
        isProject: true
    });

    const deletedSubtask = new Task({
        id: "deleted-subtask",
        title: "Subtarea borrada",
        parentTaskId: project.id,
        status: TaskStatus.DELETED
    });

    const service = new TaskService(
        createRepository([
            project,
            deletedSubtask
        ])
    );

    const updated = service.updateTask(
        project.id,
        {
            isProject: false
        }
    );

    assert.equal(updated.isProject, false);

    service.ensureProjectFlags();

    assert.equal(updated.isProject, false);

});

test("mantiene la marca de proyecto obligatoria mientras exista una subtarea no borrada", () => {

    const project = new Task({
        id: "project",
        title: "Proyecto",
        isProject: true
    });

    const activeSubtask = new Task({
        id: "active-subtask",
        title: "Subtarea activa",
        parentTaskId: project.id
    });

    const service = new TaskService(
        createRepository([
            project,
            activeSubtask
        ])
    );

    assert.throws(
        () => service.updateTask(
            project.id,
            {
                isProject: false
            }
        ),
        /Una tarea con subtareas debe seguir siendo un proyecto\./
    );

    assert.equal(project.isProject, true);

});