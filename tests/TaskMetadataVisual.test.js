import test from "node:test";
import assert from "node:assert/strict";

import { Priority } from "../src/domain/Priority.js";
import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

function renderTask(task, entities = {}) {

    return new TaskList().render(
        [task],
        "Todas",
        false,
        entities.areas ?? [],
        entities.contexts ?? [],
        entities.tags ?? []
    );

}

test("muestra área, contexto y etiquetas como chips de color", () => {

    const task = new Task({
        id: "task-visual",
        title: "Preparar clase",
        areaId: "area-1",
        contextId: "context-1",
        tagIds: ["tag-1"]
    });

    const html = renderTask(task, {
        areas: [{
            id: "area-1",
            name: "Trabajo",
            color: "#3b82f6"
        }],
        contexts: [{
            id: "context-1",
            name: "Escuela",
            color: "#22c55e"
        }],
        tags: [{
            id: "tag-1",
            name: "Urgente",
            color: "#a855f7"
        }]
    });

    assert.equal(
        (html.match(/class="taskMetaChip"/g) ?? []).length,
        3
    );

    assert.match(
        html,
        /style="--meta-color: #3b82f6"/
    );

    assert.match(
        html,
        /title="Contexto: Escuela"/
    );

    assert.match(
        html,
        /title="Etiqueta: Urgente"/
    );

});

test("muestra la prioridad mediante una bandera con color", () => {

    const task = new Task({
        id: "task-priority",
        title: "Corregir evaluaciones",
        priority: Priority.CRITICAL
    });

    const html = renderTask(task);

    assert.match(
        html,
        /class="priorityIndicator priority-4"/
    );

    assert.match(
        html,
        /aria-label="Prioridad: Crítica"/
    );

    assert.doesNotMatch(
        html,
        />Prioridad: Crítica</
    );

});

test("usa un color seguro cuando el dato no es válido", () => {

    const task = new Task({
        id: "task-safe-color",
        title: "Revisar material",
        areaId: "area-unsafe"
    });

    const html = renderTask(task, {
        areas: [{
            id: "area-unsafe",
            name: "Área",
            color: "red; color: transparent"
        }]
    });

    assert.match(
        html,
        /style="--meta-color: #64748b"/
    );

    assert.doesNotMatch(
        html,
        /red; color: transparent/
    );

});
