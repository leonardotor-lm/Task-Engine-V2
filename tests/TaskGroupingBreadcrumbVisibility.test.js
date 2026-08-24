import test from "node:test";
import assert from "node:assert/strict";
import {
    isSeparatedContextSubtask
} from "../src/ui/TaskGroupingController.js";

function maps({ rows = [], groups = [] } = {}) {
    return {
        rowById: new Map(rows.map(id => [id, {}])),
        groupKeyByTaskId: new Map(groups)
    };
}

test("muestra breadcrumb si el padre no quedó entre las filas visibles del grupo", () => {
    const task = {
        id: "child",
        parentTaskId: "parent"
    };
    const { rowById, groupKeyByTaskId } = maps({
        rows: ["child"],
        groups: [["child", "cel"]]
    });

    assert.equal(
        isSeparatedContextSubtask(
            task,
            "cel",
            rowById,
            groupKeyByTaskId
        ),
        true
    );
});

test("muestra breadcrumb si el padre visible pertenece a otro contexto", () => {
    const task = {
        id: "child",
        parentTaskId: "parent"
    };
    const { rowById, groupKeyByTaskId } = maps({
        rows: ["parent", "child"],
        groups: [
            ["parent", "pc"],
            ["child", "cel"]
        ]
    });

    assert.equal(
        isSeparatedContextSubtask(
            task,
            "cel",
            rowById,
            groupKeyByTaskId
        ),
        true
    );
});

test("no agrega breadcrumb extra si padre e hijo siguen juntos en el mismo contexto", () => {
    const task = {
        id: "child",
        parentTaskId: "parent"
    };
    const { rowById, groupKeyByTaskId } = maps({
        rows: ["parent", "child"],
        groups: [
            ["parent", "cel"],
            ["child", "cel"]
        ]
    });

    assert.equal(
        isSeparatedContextSubtask(
            task,
            "cel",
            rowById,
            groupKeyByTaskId
        ),
        false
    );
});

test("una tarea de nivel superior nunca se considera subtarea separada", () => {
    const task = {
        id: "root",
        parentTaskId: null
    };
    const { rowById, groupKeyByTaskId } = maps({
        rows: ["root"],
        groups: [["root", "cel"]]
    });

    assert.equal(
        isSeparatedContextSubtask(
            task,
            "cel",
            rowById,
            groupKeyByTaskId
        ),
        false
    );
});
