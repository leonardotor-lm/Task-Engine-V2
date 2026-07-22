import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";

test("detecta cuando un área está asignada a una tarea", () => {

    const repository = {

        getAll() {

            return [
                {
                    id: "task-1",
                    areaId: "area-1"
                },
                {
                    id: "task-2",
                    areaId: null
                }
            ];

        }

    };

    const service = new TaskService(repository);

    assert.equal(
        service.hasTasksInArea("area-1"),
        true
    );

});

test("indica cuando un área no está asignada a ninguna tarea", () => {

    const repository = {

        getAll() {

            return [
                {
                    id: "task-1",
                    areaId: "area-1"
                }
            ];

        }

    };

    const service = new TaskService(repository);

    assert.equal(
        service.hasTasksInArea("area-2"),
        false
    );

});