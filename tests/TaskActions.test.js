import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function createFixture() {

    const task = {

        id: "task-1",
        status: TaskStatus.PENDING,

        archive() {

            this.status = TaskStatus.ARCHIVED;

        },

        delete() {

            this.status = TaskStatus.DELETED;

        }

    };

    let savedTask = null;

    const repository = {

        getAll() {

            return [task];

        },

        getById(id) {

            return id === task.id
                ? task
                : null;

        },

        update(updatedTask) {

            savedTask = updatedTask;

        }

    };

    return {

        task,
        repository,

        getSavedTask() {

            return savedTask;

        }

    };

}

test("archiva una tarea y guarda el cambio", () => {

    const fixture = createFixture();

    const service = new TaskService(
        fixture.repository
    );

    const result = service.archiveTask("task-1");

    assert.equal(
        result.status,
        TaskStatus.ARCHIVED
    );

    assert.equal(
        fixture.getSavedTask(),
        fixture.task
    );

});

test("elimina lógicamente una tarea y guarda el cambio", () => {

    const fixture = createFixture();

    const service = new TaskService(
        fixture.repository
    );

    const result = service.deleteTask("task-1");

    assert.equal(
        result.status,
        TaskStatus.DELETED
    );

    assert.equal(
        fixture.getSavedTask(),
        fixture.task
    );

});

test("no modifica nada si la tarea no existe", () => {

    const fixture = createFixture();

    const service = new TaskService(
        fixture.repository
    );

    assert.equal(
        service.archiveTask("inexistente"),
        null
    );

    assert.equal(
        service.deleteTask("inexistente"),
        null
    );

    assert.equal(
        fixture.getSavedTask(),
        null
    );

});