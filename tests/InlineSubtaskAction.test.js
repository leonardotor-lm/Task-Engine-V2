import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

test("muestra la acción rápida y el formulario inline", () => {

    const task = new Task({
        id: "parent",
        title: "Tarea principal"
    });

    const html = new TaskList().render(
        [task],
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
        [task],
        "",
        "Nueva tarea",
        task.id
    );

    assert.match(
        html,
        /class="quickAddSubtask"/
    );

    assert.match(
        html,
        /class="inlineSubtaskForm"/
    );

    assert.match(
        html,
        /placeholder="Nueva subtarea"/
    );

    assert.match(
        html,
        /data-parent-id="parent"/
    );

});

test("no ofrece agregar subtareas a una tarea completada", () => {

    const task = new Task({
        id: "completed",
        title: "Terminada"
    });

    task.complete();

    const html = new TaskList().render(
        [task],
        "Completadas"
    );

    assert.doesNotMatch(
        html,
        /class="quickAddSubtask"/
    );

});
