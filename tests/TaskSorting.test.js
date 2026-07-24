import test from "node:test";
import assert from "node:assert/strict";

import {
    TaskSort,
    compareTasks,
    sortTaskTree
} from "../src/core/TaskSorting.js";

function task(id, overrides = {}) {

    return {
        id,
        title: overrides.title ?? id,
        parentTaskId: overrides.parentTaskId ?? null,
        manualOrder: overrides.manualOrder ?? 0,
        priority: overrides.priority ?? 0,
        dueDate: overrides.dueDate ?? null,
        createdAt:
            overrides.createdAt ??
            "2026-07-24T10:00:00.000Z"
    };

}

test("ordena las fechas próximas primero y deja sin fecha al final", () => {

    const tasks = [
        task("sin-fecha"),
        task("tarde", { dueDate: "2026-08-10" }),
        task("temprano", { dueDate: "2026-07-25" })
    ];

    const result = sortTaskTree(
        tasks,
        TaskSort.DUE_DATE
    );

    assert.deepEqual(
        result.map(item => item.id),
        ["temprano", "tarde", "sin-fecha"]
    );

});

test("ordena las prioridades de mayor a menor", () => {

    const tasks = [
        task("baja", { priority: 1 }),
        task("crítica", { priority: 4 }),
        task("media", { priority: 2 })
    ];

    const result = sortTaskTree(
        tasks,
        TaskSort.PRIORITY
    );

    assert.deepEqual(
        result.map(item => item.id),
        ["crítica", "media", "baja"]
    );

});

test("ordena por creación en ambas direcciones", () => {

    const oldTask = task("antigua", {
        createdAt: "2026-07-20T10:00:00.000Z"
    });

    const newTask = task("nueva", {
        createdAt: "2026-07-24T10:00:00.000Z"
    });

    assert.deepEqual(
        sortTaskTree(
            [oldTask, newTask],
            TaskSort.CREATED_NEWEST
        ).map(item => item.id),
        ["nueva", "antigua"]
    );

    assert.deepEqual(
        sortTaskTree(
            [newTask, oldTask],
            TaskSort.CREATED_OLDEST
        ).map(item => item.id),
        ["antigua", "nueva"]
    );

});

test("conserva cada subtarea debajo de su padre", () => {

    const parentLater = task("padre-tarde", {
        dueDate: "2026-08-10"
    });

    const childEarly = task("hija-temprana", {
        parentTaskId: parentLater.id,
        dueDate: "2026-07-20"
    });

    const parentEarly = task("padre-temprano", {
        dueDate: "2026-07-25"
    });

    const result = sortTaskTree(
        [parentLater, childEarly, parentEarly],
        TaskSort.DUE_DATE
    );

    assert.deepEqual(
        result.map(item => item.id),
        ["padre-temprano", "padre-tarde", "hija-temprana"]
    );

});

test("ordena subtareas solamente entre hermanas", () => {

    const parent = task("padre");
    const low = task("baja", {
        parentTaskId: parent.id,
        priority: 1
    });
    const high = task("alta", {
        parentTaskId: parent.id,
        priority: 3
    });

    const result = sortTaskTree(
        [parent, low, high],
        TaskSort.PRIORITY
    );

    assert.deepEqual(
        result.map(item => item.id),
        ["padre", "alta", "baja"]
    );

});

test("el criterio manual usa manualOrder", () => {

    const first = task("primera", { manualOrder: 1 });
    const second = task("segunda", { manualOrder: 2 });

    assert.equal(
        compareTasks(
            first,
            second,
            TaskSort.MANUAL
        ) < 0,
        true
    );

});
