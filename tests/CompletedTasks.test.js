import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

test("obtiene únicamente las tareas completadas", () => {

    const repository = {

        getAll() {

            return [

                {
                    id: "pending",
                    status: TaskStatus.PENDING
                },

                {
                    id: "completed",
                    status: TaskStatus.COMPLETED
                },

                {
                    id: "archived",
                    status: TaskStatus.ARCHIVED
                }

            ];

        }

    };

    const service = new TaskService(repository);

    assert.deepEqual(
        service.getCompletedTasks().map(task => task.id),
        ["completed"]
    );

});