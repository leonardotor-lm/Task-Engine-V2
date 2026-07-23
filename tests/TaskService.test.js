import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";

function createRepository(tasks) {

    return {

        getAll() {

            return tasks;

        }

    };

}

test("detecta cuando un área está asignada a una tarea", () => {

    const repository = createRepository([
        {
            id: "task-1",
            areaId: "area-1",
            contextId: null
        },
        {
            id: "task-2",
            areaId: null,
            contextId: null
        }
    ]);

    const service = new TaskService(repository);

    assert.equal(
        service.hasTasksInArea("area-1"),
        true
    );

});

test("indica cuando un área no está asignada a ninguna tarea", () => {

    const repository = createRepository([
        {
            id: "task-1",
            areaId: "area-1",
            contextId: null
        }
    ]);

    const service = new TaskService(repository);

    assert.equal(
        service.hasTasksInArea("area-2"),
        false
    );

});

test("detecta cuando un contexto está asignado a una tarea", () => {

    const repository = createRepository([
        {
            id: "task-1",
            areaId: null,
            contextId: "context-1"
        },
        {
            id: "task-2",
            areaId: null,
            contextId: null
        }
    ]);

    const service = new TaskService(repository);

    assert.equal(
        service.hasTasksInContext("context-1"),
        true
    );

});

test("indica cuando un contexto no está asignado a ninguna tarea", () => {

    const repository = createRepository([
        {
            id: "task-1",
            areaId: null,
            contextId: "context-1"
        }
    ]);

    const service = new TaskService(repository);

    assert.equal(
        service.hasTasksInContext("context-2"),
        false
    );

});