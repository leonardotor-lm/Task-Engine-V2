import test from "node:test";
import assert from "node:assert/strict";
import { Task } from "../src/domain/Task.js";

function createTask(data = {}) {
    return new Task({
        id: "task-reminder",
        title: "Renovar documento",
        createdAt: "2026-08-25T12:00:00.000Z",
        updatedAt: "2026-08-25T12:00:00.000Z",
        ...data
    });
}

test("persiste un recordatorio relativo al vencimiento", () => {

    const task = createTask({
        dueDate: "2026-09-10",
        dueTime: "09:30",
        reminder: {
            type: "due",
            minutesBefore: 2880
        }
    });

    assert.deepEqual(task.reminder, {
        type: "due",
        minutesBefore: 2880
    });
    assert.deepEqual(task.toJSON().reminder, {
        type: "due",
        minutesBefore: 2880
    });
});

test("persiste un recordatorio absoluto independiente del vencimiento", () => {

    const task = createTask({
        reminder: {
            type: "at",
            at: "2027-02-25T15:00:00.000Z"
        }
    });

    assert.equal(
        task.toJSON().reminder.at,
        "2027-02-25T15:00:00.000Z"
    );
    assert.equal(task.dueDate, null);
});

test("permite quitar un recordatorio existente", () => {

    const task = createTask({
        reminder: {
            type: "due",
            minutesBefore: 60
        }
    });

    task.update({ reminder: null });

    assert.equal(task.reminder, null);
    assert.equal(task.toJSON().reminder, null);
});

test("rechaza anticipaciones no soportadas", () => {

    assert.throws(
        () => createTask({
            reminder: {
                type: "due",
                minutesBefore: 3
            }
        }),
        /anticipación del recordatorio/i
    );
});

test("normaliza la fecha ISO del recordatorio absoluto", () => {

    const task = createTask({
        reminder: {
            type: "at",
            at: "2027-02-25T12:00:00-03:00"
        }
    });

    assert.equal(
        task.reminder.at,
        "2027-02-25T15:00:00.000Z"
    );
});
