import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function createFixture() {

    const archivedTask = {

        id: "archived-1",
        status: TaskStatus.ARCHIVED,

        restoreFromArchive() {

            this.status = TaskStatus.PENDING;

        }

    };

    const deletedTask = {

        id: "deleted-1",
        status: TaskStatus.DELETED,

        restoreFromTrash() {

            this.status = TaskStatus.PENDING;

        }

    };

    const activeTask = {

        id: "active-1",
        status: TaskStatus.PENDING

    };

    const tasks = [
        archivedTask,
        deletedTask,
        activeTask
    ];

    let savedTask = null;

    const repository = {

        getAll() {

            return tasks;

        },

        getById(id) {

            return tasks.find(
                task => task.id === id
            ) ?? null;

        },

        update(task) {

            savedTask = task;

        }

    };

    return {

        archivedTask,
        deletedTask,
        repository,

        getSavedTask() {

            return savedTask;

        }

    };

}

test("obtiene únicamente las tareas archivadas", () => {

    const fixture = createFixture();
    const service = new TaskService(fixture.repository);

    assert.deepEqual(
        service.getArchivedTasks().map(task => task.id),
        ["archived-1"]
    );

});

test("obtiene únicamente las tareas eliminadas", () => {

    const fixture = createFixture();
    const service = new TaskService(fixture.repository);

    assert.deepEqual(
        service.getDeletedTasks().map(task => task.id),
        ["deleted-1"]
    );

});

test("restaura y guarda una tarea archivada", () => {

    const fixture = createFixture();
    const service = new TaskService(fixture.repository);

    const result = service.restoreArchivedTask("archived-1");

    assert.equal(result.status, TaskStatus.PENDING);
    assert.equal(fixture.getSavedTask(), fixture.archivedTask);

});

test("restaura y guarda una tarea eliminada", () => {

    const fixture = createFixture();
    const service = new TaskService(fixture.repository);

    const result = service.restoreDeletedTask("deleted-1");

    assert.equal(result.status, TaskStatus.PENDING);
    assert.equal(fixture.getSavedTask(), fixture.deletedTask);

});