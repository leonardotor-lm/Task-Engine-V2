import test from "node:test";
import assert from "node:assert/strict";

import {
    RecurrenceLifecycleController
} from "../src/ui/RecurrenceLifecycleController.js";

function recurringTask(
    id,
    recurrenceId,
    state = "active"
) {
    return {
        id,
        recurrenceId,
        recurrence: "DAILY",
        isCompleted: () => state === "completed",
        isArchived: () => state === "archived",
        isDeleted: () => state === "deleted"
    };
}

function createService(tasks, handlers = {}) {

    const service = {
        tasks: [...tasks],
        getAllTasks() {
            return [...this.tasks];
        },
        repository: {
            remove: id => {
                service.tasks = service.tasks
                    .filter(task => task.id !== id);
            }
        },
        toggleTask(...args) {
            return handlers.toggleTask?.(
                service,
                ...args
            );
        },
        completeTasks(...args) {
            return handlers.completeTasks?.(
                service,
                ...args
            );
        }
    };

    return service;
}

test("mantiene una sola ocurrencia nueva cuando no había otra activa", () => {

    const current = recurringTask(
        "current",
        "series-1",
        "completed"
    );

    const service = createService(
        [current],
        {
            toggleTask(innerService) {
                innerService.tasks.push(
                    recurringTask(
                        "next",
                        "series-1"
                    )
                );
                return current;
            }
        }
    );

    new RecurrenceLifecycleController({
        taskService: service
    }).start();

    service.toggleTask("current");

    assert.deepEqual(
        service.tasks.map(task => task.id),
        ["current", "next"]
    );

});

test("no crea otra ocurrencia si la serie ya tiene una activa", () => {

    const completed = recurringTask(
        "completed",
        "series-1",
        "completed"
    );
    const active = recurringTask(
        "active",
        "series-1"
    );

    const service = createService(
        [completed, active],
        {
            toggleTask(innerService) {
                innerService.tasks.push(
                    recurringTask(
                        "duplicate-next",
                        "series-1"
                    )
                );
                return completed;
            }
        }
    );

    new RecurrenceLifecycleController({
        taskService: service
    }).start();

    service.toggleTask("completed");

    assert.deepEqual(
        service.tasks.map(task => task.id),
        ["completed", "active"]
    );

});

test("la finalización masiva deja como máximo una nueva ocurrencia por serie", () => {

    const first = recurringTask(
        "first",
        "series-1",
        "completed"
    );
    const second = recurringTask(
        "second",
        "series-1",
        "completed"
    );

    const service = createService(
        [first, second],
        {
            completeTasks(innerService) {
                innerService.tasks.push(
                    recurringTask(
                        "next-a",
                        "series-1"
                    ),
                    recurringTask(
                        "next-b",
                        "series-1"
                    )
                );
                return [first, second];
            }
        }
    );

    new RecurrenceLifecycleController({
        taskService: service
    }).start();

    service.completeTasks([
        "first",
        "second"
    ]);

    const active = service.tasks.filter(
        task =>
            task.recurrenceId === "series-1" &&
            !task.isCompleted() &&
            !task.isArchived() &&
            !task.isDeleted()
    );

    assert.equal(active.length, 1);

});
