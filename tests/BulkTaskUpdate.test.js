import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { Priority } from "../src/domain/Priority.js";
import { TaskService } from "../src/core/TaskService.js";

class MemoryRepository {

    constructor(tasks) {
        this.tasks = [...tasks];
        this.batchWrites = 0;
    }

    getAll() {
        return [...this.tasks];
    }

    getById(id) {
        return this.tasks.find(
            task => task.id === id
        ) ?? null;
    }

    updateMany(tasks) {

        const replacements = new Map(
            tasks.map(task => [task.id, task])
        );

        this.tasks = this.tasks.map(
            task =>
                replacements.get(task.id) ??
                task
        );

        this.batchWrites += 1;

    }

}

function setup() {

    const repository = new MemoryRepository([
        new Task({
            id: "task-1",
            title: "Primera"
        }),
        new Task({
            id: "task-2",
            title: "Segunda"
        })
    ]);

    return {
        repository,
        service: new TaskService(repository)
    };

}

test("asigna prioridad a varias tareas con una sola escritura", () => {

    const {
        repository,
        service
    } = setup();

    service.updateTasks(
        ["task-1", "task-2"],
        {
            priority: Priority.HIGH
        }
    );

    assert.deepEqual(
        repository.getAll().map(
            task => task.priority
        ),
        [Priority.HIGH, Priority.HIGH]
    );

    assert.equal(
        repository.batchWrites,
        1
    );

});

test("asigna una fecha a varias tareas", () => {

    const {
        repository,
        service
    } = setup();

    service.updateTasks(
        ["task-1", "task-2"],
        {
            dueDate: "2026-08-10"
        }
    );

    assert.deepEqual(
        repository.getAll().map(
            task => task.dueDate
        ),
        [
            "2026-08-10",
            "2026-08-10"
        ]
    );

});

test("no modifica ninguna tarea si falta una selección", () => {

    const {
        repository,
        service
    } = setup();

    const versionsBefore =
        repository.getAll().map(
            task => task.version
        );

    assert.throws(
        () => service.updateTasks(
            ["task-1", "missing"],
            {
                priority: Priority.CRITICAL
            }
        ),
        /ya no existe/
    );

    assert.deepEqual(
        repository.getAll().map(
            task => task.version
        ),
        versionsBefore
    );

    assert.equal(
        repository.batchWrites,
        0
    );

});
