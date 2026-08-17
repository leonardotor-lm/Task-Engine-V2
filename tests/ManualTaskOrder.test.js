import test from "node:test";
import assert from "node:assert/strict";
import {
    reorderTaskAmongSiblings
} from "../src/core/ManualTaskOrder.js";

function task(
    id,
    {
        parentTaskId = null,
        manualOrder = 0,
        createdAt = id
    } = {}
) {
    return {
        id,
        parentTaskId,
        manualOrder,
        createdAt,
        touched: 0,
        touch() {
            this.touched += 1;
        }
    };
}

function service(tasks) {
    const updates = [];

    return {
        updates,
        getAllTasks() {
            return tasks;
        },
        getTaskById(id) {
            return tasks.find(
                item => item.id === id
            ) ?? null;
        },
        repository: {
            updateMany(changed) {
                updates.push(
                    changed.map(item => item.id)
                );
            }
        }
    };
}

test("reordena tareas hermanas antes del destino", () => {
    const tasks = [
        task("a", { manualOrder: 0 }),
        task("b", { manualOrder: 1 }),
        task("c", { manualOrder: 2 })
    ];
    const taskService = service(tasks);

    const changed = reorderTaskAmongSiblings(
        taskService,
        "c",
        "a",
        "before"
    );

    assert.equal(changed, true);
    assert.deepEqual(
        tasks
            .sort((a, b) =>
                a.manualOrder - b.manualOrder
            )
            .map(item => item.id),
        ["c", "a", "b"]
    );
    assert.equal(
        taskService.updates.length,
        1
    );
});

test("reordena después del destino", () => {
    const tasks = [
        task("a", { manualOrder: 0 }),
        task("b", { manualOrder: 1 }),
        task("c", { manualOrder: 2 })
    ];
    const taskService = service(tasks);

    reorderTaskAmongSiblings(
        taskService,
        "a",
        "b",
        "after"
    );

    assert.deepEqual(
        tasks
            .sort((a, b) =>
                a.manualOrder - b.manualOrder
            )
            .map(item => item.id),
        ["b", "a", "c"]
    );
});

test("no permite mover una tarea entre padres distintos", () => {
    const tasks = [
        task("a", { parentTaskId: "p1" }),
        task("b", { parentTaskId: "p2" })
    ];
    const taskService = service(tasks);

    assert.equal(
        reorderTaskAmongSiblings(
            taskService,
            "a",
            "b",
            "before"
        ),
        false
    );
    assert.equal(
        taskService.updates.length,
        0
    );
});

test("incluye hermanos no visibles al normalizar manualOrder", () => {
    const tasks = [
        task("visible-a", {
            manualOrder: 0
        }),
        task("oculta", {
            manualOrder: 1
        }),
        task("visible-b", {
            manualOrder: 2
        })
    ];
    const taskService = service(tasks);

    reorderTaskAmongSiblings(
        taskService,
        "visible-b",
        "visible-a",
        "before"
    );

    assert.deepEqual(
        tasks
            .sort((a, b) =>
                a.manualOrder - b.manualOrder
            )
            .map(item => item.id),
        ["visible-b", "visible-a", "oculta"]
    );
});
