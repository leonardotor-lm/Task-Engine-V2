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
        /class="icon quickActionIcon"/
    );

    assert.match(
        html,
        /class="closeQuickActions iconButton"/
    );

    assert.doesNotMatch(
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

test("reserva Mover y Convertir en principal para el editor", () => {

    const task = new Task({
        id: "task",
        title: "Tarea"
    });

    const destination = new Task({
        id: "destination",
        title: "Proyecto de destino"
    });

    const html = render([
        task,
        destination
    ]);

    assert.doesNotMatch(
        html,
        /class="quickMoveTask"/
    );
    assert.doesNotMatch(
        html,
        /class="quickDetachSubtask"/
    );

});

test("reserva Quitar fecha para el editor", () => {

    const dated = new Task({
        id: "dated",
        title: "Con fecha",
        dueDate: "2026-07-25"
    });

    const undated = new Task({
        id: "undated",
        title: "Sin fecha"
    });

    const datedHtml = render([dated]);
    const undatedHtml = render([undated]);

    assert.doesNotMatch(
        datedHtml,
        /class="quickClearDueDate"/
    );

    assert.doesNotMatch(
        undatedHtml,
        /class="quickClearDueDate"/
    );

});

test("muestra acciones de recurrencia sólo cuando corresponde", () => {

    const recurring = new Task({
        id: "recurring",
        title: "Tarea diaria",
        dueDate: "2026-07-25",
        recurrence: "DAILY"
    });

    const html = render([recurring]);

    assert.match(
        html,
        /class="quickSkipRecurringTask"/
    );

    assert.match(
        html,
        /class="quickEndRecurrence"/
    );

    assert.match(
        html,
        /class="quickEditTask"/
    );

    assert.doesNotMatch(
        html,
        /class="quickClearDueDate"/
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
