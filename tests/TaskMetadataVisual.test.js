import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Priority } from "../src/domain/Priority.js";
import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

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

test("diferencia visualmente área, contexto y etiquetas", () => {

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

    assert.match(
        html,
        /class="taskMetaEntity taskMetaArea"/
    );

    assert.match(
        html,
        /class="taskMetaEntity taskMetaContext"/
    );

    assert.match(
        html,
        /class="taskMetaEntity taskMetaTag"/
    );

    assert.match(
        html,
        /@Escuela/
    );

    assert.match(
        html,
        /#Urgente/
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
        /class="taskMetaEntity taskMetaContext"[\s\S]*?style="--meta-color: #22c55e"[\s\S]*?@Escuela/
    );

    assert.match(
        styles,
        /\.taskMetaContext\s*\{[\s\S]*?padding:\s*0;[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?color:\s*var\(--meta-color\);/
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

test("avisa siempre cuando una tarea tiene una nota de Notion", () => {

    const task = new Task({
        id: "task-notion",
        title: "Preparar clase",
        notionPageId: "page-1",
        notionPageUrl:
            "https://www.notion.so/page-1"
    });

    const html = new TaskList().render(
        [task],
        "Todas",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(),
        false,
        null,
        false
    );

    assert.match(
        html,
        /class="notionNoteIndicator"/
    );
    assert.match(
        html,
        /Tiene una nota vinculada en Notion/
    );
    assert.match(
        html,
        /class="icon notionNoteIcon"/
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

test("la recurrencia se representa sólo con el icono", () => {

    const task = new Task({
        id: "task-recurring",
        title: "Planificar semana",
        dueDate: "2026-07-25",
        recurrence: "WEEKLY"
    });

    const html = renderTask(task);

    assert.match(
        html,
        /class="recurrenceIcon"/
    );

    assert.doesNotMatch(
        html,
        /Repetición:/
    );

    assert.doesNotMatch(
        html,
        /Semanal/
    );

});

test("muestra la casilla de completar fuera del modo múltiple", () => {

    const task = new Task({
        id: "task-complete-control",
        title: "Completar desde la lista"
    });

    const html = new TaskList().render(
        [task],
        "Inbox",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(),
        false,
        "ACTIVE"
    );

    assert.match(
        html,
        /class="taskCompleteCheckbox"/
    );

    assert.doesNotMatch(
        html,
        /class="bulkTaskCheckbox"/
    );

});

test("reemplaza completar por seleccionar en modo múltiple", () => {

    const task = new Task({
        id: "task-bulk-control",
        title: "Editar en lote"
    });

    const html = new TaskList().render(
        [task],
        "Inbox",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(),
        true,
        "ACTIVE"
    );

    assert.match(
        html,
        /class="bulkTaskCheckbox"/
    );

    assert.doesNotMatch(
        html,
        /class="taskCompleteCheckbox"/
    );

});

test("ordena prioridad fecha área contexto y etiquetas", () => {

    const task = new Task({
        id: "task-metadata-order",
        title: "Orden visual",
        priority: Priority.HIGH,
        dueDate: "2026-08-20",
        areaId: "area-order",
        contextId: "context-order",
        tagIds: ["tag-order"]
    });

    const html = new TaskList().render(
        [task],
        "Todas",
        false,
        [{
            id: "area-order",
            name: "Área",
            color: "#3b82f6"
        }],
        [{
            id: "context-order",
            name: "Contexto",
            color: "#22c55e"
        }],
        [{
            id: "tag-order",
            name: "Etiqueta",
            color: "#a855f7"
        }],
        "",
        new Set(),
        false,
        new Set(),
        false,
        "ACTIVE",
        true,
        "2026-07-25"
    );

    const positions = [
        html.indexOf("priorityIndicator"),
        html.indexOf("taskDueDate"),
        html.indexOf("taskMetaArea"),
        html.indexOf("taskMetaContext"),
        html.indexOf("taskMetaTag")
    ];

    assert.ok(
        positions.every(position => position >= 0)
    );

    assert.deepEqual(
        [...positions].sort((a, b) => a - b),
        positions
    );

});

test("abrevia las fechas según su proximidad", () => {

    const list = new TaskList();

    assert.equal(
        list.formatSmartDate(
            "2026-07-25",
            "2026-07-25"
        ),
        "Hoy"
    );

    assert.equal(
        list.formatSmartDate(
            "2026-07-26",
            "2026-07-25"
        ),
        "Mañana"
    );

    assert.equal(
        list.formatSmartDate(
            "2026-08-20",
            "2026-07-25"
        ),
        "20/08"
    );

    assert.equal(
        list.formatSmartDate(
            "2027-01-10",
            "2026-07-25"
        ),
        "10/01/2027"
    );

});

test("el modo reducido conserva sólo alertas importantes", () => {

    const task = new Task({
        id: "task-compact",
        title: "Alerta visible",
        priority: Priority.CRITICAL,
        dueDate: "2026-07-24",
        areaId: "area-hidden",
        contextId: "context-hidden",
        tagIds: ["tag-hidden"]
    });

    const html = new TaskList().render(
        [task],
        "Todas",
        false,
        [{
            id: "area-hidden",
            name: "Área oculta",
            color: "#3b82f6"
        }],
        [{
            id: "context-hidden",
            name: "Contexto oculto",
            color: "#22c55e"
        }],
        [{
            id: "tag-hidden",
            name: "Etiqueta oculta",
            color: "#a855f7"
        }],
        "",
        new Set(),
        false,
        new Set(),
        false,
        "ACTIVE",
        false,
        "2026-07-25"
    );

    assert.match(
        html,
        /priority-4/
    );

    assert.match(
        html,
        /taskDueDate overdue/
    );

    assert.doesNotMatch(
        html,
        /taskMetaArea/
    );

    assert.doesNotMatch(
        html,
        /taskMetaTag/
    );

    assert.doesNotMatch(
        html,
        /taskMetaContext/
    );

});

test("avisa cuando la selección múltiple está activa", () => {

    const task = new Task({
        id: "task-mode-notice",
        title: "Seleccionar"
    });

    const html = new TaskList().render(
        [task],
        "Todas",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(),
        true,
        "ACTIVE"
    );

    assert.match(
        html,
        /Modo de selección múltiple activo/
    );

});
