import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";

class MemoryRepository {

    constructor(task) {
        this.task = task;
    }

    getById(id) {
        return this.task.id === id
            ? this.task
            : null;
    }

    update(task) {
        this.task = task;
    }

}

test("finaliza una recurrencia sin cambiar la fecha actual", () => {

    const task = new Task({
        id: "recurring",
        title: "Rutina diaria",
        dueDate: "2026-07-25",
        recurrence: "DAILY"
    });

    const repository =
        new MemoryRepository(task);

    const service =
        new TaskService(repository);

    const result =
        service.endRecurrence(task.id);

    assert.equal(result.recurrence, null);
    assert.equal(
        result.dueDate,
        "2026-07-25"
    );

    assert.equal(
        repository.task.recurrence,
        null
    );

});

test("no finaliza una tarea que no es recurrente", () => {

    const task = new Task({
        id: "ordinary",
        title: "Tarea común",
        dueDate: "2026-07-25"
    });

    const service = new TaskService(
        new MemoryRepository(task)
    );

    assert.throws(
        () => service.endRecurrence(task.id),
        /recurrencia activa/
    );

});
