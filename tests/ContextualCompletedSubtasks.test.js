import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

test("incluye subtareas completadas debajo de tareas activas", () => {

    const tasks = [
        {
            id: "parent",
            parentTaskId: null,
            status: TaskStatus.PENDING
        },
        {
            id: "completed-child",
            parentTaskId: "parent",
            status: TaskStatus.COMPLETED
        },
        {
            id: "completed-grandchild",
            parentTaskId: "completed-child",
            status: TaskStatus.COMPLETED
        },
        {
            id: "unrelated-completed",
            parentTaskId: null,
            status: TaskStatus.COMPLETED
        }
    ];

    const repository = {

        getAll() {

            return [...tasks];

        }

    };

    const service = new TaskService(repository);

    const result = service.includeCompletedDescendants([
        tasks[0]
    ]);

    assert.deepEqual(
        result.map(task => task.id),
        [
            "parent",
            "completed-child",
            "completed-grandchild"
        ]
    );

});

test("no agrega tareas completadas sin un padre visible", () => {

    const tasks = [
        {
            id: "completed-child",
            parentTaskId: "hidden-parent",
            status: TaskStatus.COMPLETED
        }
    ];

    const service = new TaskService({

        getAll() {

            return [...tasks];

        }

    });

    assert.deepEqual(
        service.includeCompletedDescendants([]),
        []
    );

});
