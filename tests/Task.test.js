import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

test("una tarea nueva comienza en INBOX", () => {

    const task = new Task({
        title: "Preparar clase"
    });

    assert.equal(task.status, TaskStatus.INBOX);

});

test("asignar un área cambia una tarea INBOX a PENDING", () => {

    const task = new Task({
        title: "Preparar clase"
    });

    task.update({
        areaId: "area-1"
    });

    assert.equal(task.areaId, "area-1");
    assert.equal(task.status, TaskStatus.PENDING);

});

test("completar y reabrir una tarea conserva un estado válido", () => {

    const task = new Task({
        title: "Preparar clase",
        status: TaskStatus.PENDING
    });

    task.complete();

    assert.equal(task.status, TaskStatus.COMPLETED);
    assert.notEqual(task.completedAt, null);

    task.restore();

    assert.equal(task.status, TaskStatus.PENDING);
    assert.equal(task.completedAt, null);

});

test("no permite crear una tarea sin título", () => {

    assert.throws(
        () => new Task({ title: "   " }),
        {
            message: "El título no puede estar vacío."
        }
    );

});

test("asigna múltiples etiquetas a una tarea", () => {

    const task = new Task({
        title: "Preparar clase"
    });

    task.update({
        tagIds: ["tag-1", "tag-2"]
    });

    assert.deepEqual(task.tagIds, ["tag-1", "tag-2"]);

    const data = task.toJSON();

    assert.deepEqual(data.tagIds, ["tag-1", "tag-2"]);

});
