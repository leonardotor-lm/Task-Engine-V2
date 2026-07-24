import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

function render({
    selectedTaskIds = new Set(),
    enabled = true
} = {}) {

    const task = new Task({
        id: "task-1",
        title: "Preparar clase"
    });

    return new TaskList().render(
        [task],
        "Inbox",
        true,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        selectedTaskIds,
        enabled
    );

}

test("muestra una casilla para seleccionar tareas activas", () => {

    const html = render();

    assert.match(
        html,
        /class="bulkTaskCheckbox"/
    );

    assert.doesNotMatch(
        html,
        /id="applyBulkChanges"/
    );

});

test("muestra las herramientas cuando hay una selección", () => {

    const html = render({
        selectedTaskIds:
            new Set(["task-1"])
    });

    assert.match(
        html,
        /1\s+tarea seleccionada/
    );

    assert.match(
        html,
        /id="applyBulkChanges"/
    );

    assert.doesNotMatch(
        html,
        /id="applyBulkPriority"/
    );

    assert.doesNotMatch(
        html,
        /id="applyBulkDueDate"/
    );

    assert.match(
        html,
        /class="task [^"]*bulkSelectedTask/
    );

});

test("oculta la selección en vistas no compatibles", () => {

    const html = render({
        selectedTaskIds:
            new Set(["task-1"]),
        enabled: false
    });

    assert.doesNotMatch(
        html,
        /bulkTaskCheckbox/
    );

    assert.doesNotMatch(
        html,
        /bulkToolbar/
    );

});
