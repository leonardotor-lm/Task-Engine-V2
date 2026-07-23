import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

test("restaura una tarea archivada como PENDING", () => {

    const task = new Task({
        title: "Preparar clase",
        status: TaskStatus.PENDING
    });

    task.archive();
    task.restoreFromArchive();

    assert.equal(
        task.status,
        TaskStatus.PENDING
    );

});

test("restaura una tarea eliminada como PENDING", () => {

    const task = new Task({
        title: "Preparar clase",
        status: TaskStatus.PENDING
    });

    task.delete();
    task.restoreFromTrash();

    assert.equal(
        task.status,
        TaskStatus.PENDING
    );

});

test("no restaura desde archivo una tarea que no está archivada", () => {

    const task = new Task({
        title: "Preparar clase",
        status: TaskStatus.PENDING
    });

    assert.throws(
        () => task.restoreFromArchive(),
        {
            message: "La tarea no está archivada."
        }
    );

});

test("no restaura desde papelera una tarea que no está eliminada", () => {

    const task = new Task({
        title: "Preparar clase",
        status: TaskStatus.PENDING
    });

    assert.throws(
        () => task.restoreFromTrash(),
        {
            message: "La tarea no está eliminada."
        }
    );

});