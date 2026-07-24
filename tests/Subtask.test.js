import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function createFixture(parentStatus = TaskStatus.PENDING) {

    const parent = new Task({
        id: "parent",
        title: "Preparar clase",
        status: parentStatus
    });

    const tasks = [parent];

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

        }

    };

    return {
        parent,
        tasks,
        service: new TaskService(repository)
    };

}

test("crea una subtarea vinculada con su tarea principal", () => {

    const fixture = createFixture();

    const subtask = fixture.service.createSubtask(
        fixture.parent.id,
        "Buscar bibliografía"
    );

    assert.equal(subtask.parentTaskId, fixture.parent.id);
    assert.equal(subtask.title, "Buscar bibliografía");
    assert.equal(subtask.status, TaskStatus.PENDING);

});

test("una subtarea de una tarea INBOX permanece en INBOX", () => {

    const fixture = createFixture(TaskStatus.INBOX);

    const subtask = fixture.service.createSubtask(
        fixture.parent.id,
        "Buscar bibliografía"
    );

    assert.equal(subtask.status, TaskStatus.INBOX);

});

test("no crea subtareas en una tarea completada", () => {

    const fixture = createFixture(TaskStatus.COMPLETED);

    assert.throws(
        () => fixture.service.createSubtask(
            fixture.parent.id,
            "Buscar bibliografía"
        ),
        {
            message: "No se pueden agregar subtareas a esta tarea."
        }
    );

});

test("devuelve las subtareas directas", () => {

    const fixture = createFixture();

    const child = fixture.service.createSubtask(
        fixture.parent.id,
        "Buscar bibliografía"
    );

    fixture.service.createSubtask(
        child.id,
        "Revisar catálogo"
    );

    assert.deepEqual(
        fixture.service
            .getDirectSubtasks(fixture.parent.id)
            .map(task => task.title),
        ["Buscar bibliografía"]
    );

});
