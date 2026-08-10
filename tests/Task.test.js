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

test("asigna una tarea a múltiples objetivos", () => {

    const task = new Task({
        title: "Preparar clase"
    });

    task.update({
        goalIds: ["goal-1", "goal-2"]
    });

    assert.deepEqual(
        task.goalIds,
        ["goal-1", "goal-2"]
    );

    assert.deepEqual(
        task.toJSON().goalIds,
        ["goal-1", "goal-2"]
    );

});

test("conserva la fecha de inicio al serializar y actualizar", () => {

    const task = new Task({
        title: "Preparar clase",
        startDate: "2026-08-10",
        dueDate: "2026-08-12"
    });

    assert.equal(task.startDate, "2026-08-10");
    assert.equal(task.toJSON().startDate, "2026-08-10");

    task.update({ startDate: "2026-08-11" });

    assert.equal(task.startDate, "2026-08-11");

});

test("rechaza un inicio posterior al vencimiento", () => {

    assert.throws(
        () => new Task({
            title: "Preparar clase",
            startDate: "2026-08-13",
            dueDate: "2026-08-12"
        }),
        {
            message:
                "La fecha de inicio no puede ser posterior al vencimiento."
        }
    );

});
