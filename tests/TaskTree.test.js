import test from "node:test";
import assert from "node:assert/strict";

import { flattenTaskTree } from "../src/core/TaskTree.js";

test("ordena subtareas debajo de su tarea principal", () => {

    const tasks = [
        {
            id: "parent",
            parentTaskId: null
        },
        {
            id: "child",
            parentTaskId: "parent"
        },
        {
            id: "grandchild",
            parentTaskId: "child"
        }
    ];

    assert.deepEqual(
        flattenTaskTree(tasks).map(item => [
            item.task.id,
            item.depth
        ]),
        [
            ["parent", 0],
            ["child", 1],
            ["grandchild", 2]
        ]
    );

});

test("muestra como raíz una tarea cuyo padre no está visible", () => {

    const tasks = [
        {
            id: "child",
            parentTaskId: "hidden-parent"
        }
    ];

    assert.deepEqual(
        flattenTaskTree(tasks).map(item => [
            item.task.id,
            item.depth
        ]),
        [["child", 0]]
    );

});

test("no entra en un ciclo infinito con datos dañados", () => {

    const tasks = [
        {
            id: "one",
            parentTaskId: "two"
        },
        {
            id: "two",
            parentTaskId: "one"
        }
    ];

    const result = flattenTaskTree(tasks);

    assert.equal(result.length, 2);

});
