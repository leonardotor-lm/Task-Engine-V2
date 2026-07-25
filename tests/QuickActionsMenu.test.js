import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

function render(tasks) {

    return new TaskList().render(
        tasks,
        "Hoy",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(),
        false,
        "ACTIVE",
        true,
        "2026-07-25",
        tasks
    );

}

test("muestra el menú contextual en una tarea activa", () => {

    const task = new Task({
        id: "active",
        title: "Tarea activa"
    });

    const html = render([task]);

    assert.match(
        html,
        /class="quickMoreActions"/
    );

    assert.match(
        html,
        /class="quickEditTask"/
    );

    assert.match(
        html,
        /class="quickArchiveTask"/
    );

    assert.match(
        html,
        /class="quickDeleteTask destructiveAction"/
    );

});

test("oculta Archivar cuando existen descendientes activos", () => {

    const parent = new Task({
        id: "parent",
        title: "Proyecto"
    });

    const child = new Task({
        id: "child",
        title: "Paso pendiente",
        parentTaskId: parent.id
    });

    const html = render([
        parent,
        child
    ]);

    const parentRow = html.slice(
        html.indexOf('data-id="parent"'),
        html.indexOf('data-id="child"')
    );

    assert.doesNotMatch(
        parentRow,
        /class="quickArchiveTask"/
    );

});

test("no muestra el menú contextual en una tarea completada", () => {

    const task = new Task({
        id: "completed",
        title: "Terminada"
    });

    task.complete();

    const html = render([task]);

    assert.doesNotMatch(
        html,
        /class="quickMoreActions"/
    );

});
