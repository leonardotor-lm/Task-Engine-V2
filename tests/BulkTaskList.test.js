import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

function render({
    selectedTaskIds = new Set(),
    enabled = true,
    areas = [],
    contexts = [],
    tags = []
} = {}) {

    const task = new Task({
        id: "task-1",
        title: "Preparar clase"
    });

    return new TaskList().render(
        [task],
        "Inbox",
        true,
        areas,
        contexts,
        tags,
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

test("muestra área, contexto y etiquetas en la barra masiva", () => {

    const html = render({
        selectedTaskIds:
            new Set(["task-1"]),
        areas: [{
            id: "area-1",
            name: "Trabajo"
        }],
        contexts: [{
            id: "context-1",
            name: "Computadora"
        }],
        tags: [{
            id: "tag-1",
            name: "Importante"
        }]
    });

    assert.match(html, /id="bulkArea"/);
    assert.match(html, /Trabajo/);
    assert.match(html, /id="bulkContext"/);
    assert.match(html, /Computadora/);
    assert.match(html, /id="bulkTags"/);
    assert.match(html, /Importante/);

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
