import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { RecurrenceFrequency } from "../src/domain/Recurrence.js";

function createService(task) {

    const repository = {

        getAll() {

            return [task];

        },

        getById(id) {

            return id === task.id
                ? task
                : null;

        },

        update() {

        }

    };

    return new TaskService(repository);

}

test("pospone una tarea y registra el cambio", () => {

    const task = new Task({
        id: "task-1",
        title: "Preparar clase",
        status: TaskStatus.PENDING,
        dueDate: "2026-07-24"
    });

    const service = createService(task);

    service.postponeTask(
        task.id,
        "2026-07-27"
    );

    assert.equal(task.dueDate, "2026-07-27");
    assert.equal(task.postponements.length, 1);
    assert.equal(
        task.postponements[0].from,
        "2026-07-24"
    );
    assert.equal(
        task.postponements[0].to,
        "2026-07-27"
    );

});

test("conserva el historial de varias posposiciones", () => {

    const task = new Task({
        id: "task-1",
        title: "Preparar clase",
        status: TaskStatus.PENDING,
        dueDate: "2026-07-24"
    });

    const service = createService(task);

    service.postponeTask(
        task.id,
        "2026-07-27"
    );

    service.postponeTask(
        task.id,
        "2026-08-03"
    );

    assert.equal(task.postponements.length, 2);
    assert.equal(
        task.postponements[1].from,
        "2026-07-27"
    );
    assert.equal(
        task.postponements[1].to,
        "2026-08-03"
    );

});

test("rechaza una fecha igual o anterior", () => {

    const task = new Task({
        id: "task-1",
        title: "Preparar clase",
        status: TaskStatus.PENDING,
        dueDate: "2026-07-24"
    });

    const service = createService(task);

    assert.throws(
        () => service.postponeTask(
            task.id,
            "2026-07-24"
        ),
        {
            message: "La nueva fecha debe ser posterior a la fecha actual."
        }
    );

    assert.throws(
        () => service.postponeTask(
            task.id,
            "2026-07-20"
        ),
        {
            message: "La nueva fecha debe ser posterior a la fecha actual."
        }
    );

});

test("no pospone una tarea sin fecha", () => {

    const task = new Task({
        id: "task-1",
        title: "Preparar clase",
        status: TaskStatus.PENDING
    });

    const service = createService(task);

    assert.throws(
        () => service.postponeTask(
            task.id,
            "2026-07-27"
        ),
        {
            message: "La tarea necesita una fecha antes de poder posponerse."
        }
    );

});

test("separa posponer de saltear una recurrencia", () => {

    const task = new Task({
        id: "task-1",
        title: "Preparar clase",
        status: TaskStatus.PENDING,
        dueDate: "2026-07-24",
        recurrence: RecurrenceFrequency.WEEKLY
    });

    const service = createService(task);

    assert.throws(
        () => service.postponeTask(
            task.id,
            "2026-07-27"
        ),
        {
            message: "Para una tarea recurrente, usá Saltear esta vez."
        }
    );

});
