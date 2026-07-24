import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function createFixture(status = TaskStatus.DELETED) {

    const task = {
        id: "task-1",
        status
    };

    let removedId = null;

    const repository = {

        getAll() {

            return removedId === null
                ? [task]
                : [];

        },

        getById(id) {

            return id === task.id
                ? task
                : null;

        },

        remove(id) {

            removedId = id;

        }

    };

    return {

        task,
        repository,

        getRemovedId() {

            return removedId;

        }

    };

}

test("elimina definitivamente una tarea que está en la papelera", () => {

    const fixture = createFixture();
    const service = new TaskService(fixture.repository);

    const result = service.permanentlyDeleteTask("task-1");

    assert.equal(result, fixture.task);
    assert.equal(fixture.getRemovedId(), "task-1");

});

test("no elimina definitivamente una tarea activa", () => {

    const fixture = createFixture(TaskStatus.PENDING);
    const service = new TaskService(fixture.repository);

    assert.throws(
        () => service.permanentlyDeleteTask("task-1"),
        {
            message: "Sólo se puede eliminar definitivamente una tarea que esté en la papelera."
        }
    );

    assert.equal(fixture.getRemovedId(), null);

});

test("devuelve null si la tarea no existe", () => {

    const fixture = createFixture();
    const service = new TaskService(fixture.repository);

    assert.equal(
        service.permanentlyDeleteTask("inexistente"),
        null
    );

    assert.equal(fixture.getRemovedId(), null);

});
