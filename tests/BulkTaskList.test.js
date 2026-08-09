import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

function render({
    selectedTaskIds = new Set(),
    enabled = true,
    mode = "ACTIVE",
    areas = [],
    contexts = [],
    tags = [],
    goals = []
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
        enabled,
        mode,
        true,
        "",
        [task],
        "",
        "Nueva tarea",
        null,
        "",
        goals
    );

}

test("muestra una casilla para seleccionar tareas activas", () => {

    const html = render();

    assert.match(
        html,
        /class="bulkTaskCheckbox"/
    );

    assert.match(html, /id="bulkSelectAll"/);
    assert.match(html, /Seleccionar todas/);
    assert.match(html, /0 de 1/);

    assert.doesNotMatch(
        html,
        /id="applyBulkChanges"/
    );

});

test("seleccionar todas refleja el conjunto visible", () => {

    const html = render({
        selectedTaskIds:
            new Set(["task-1"])
    });

    assert.match(
        html,
        /id="bulkSelectAll"[\s\S]*?checked/
    );
    assert.match(html, /1 de 1/);

});

test("muestra estado parcial cuando sólo parte de la vista está seleccionada", () => {

    const tasks = [
        new Task({
            id: "task-1",
            title: "Primera"
        }),
        new Task({
            id: "task-2",
            title: "Segunda"
        })
    ];

    const html = new TaskList().render(
        tasks,
        "Todas",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(["task-1"]),
        true,
        "ACTIVE"
    );

    assert.match(
        html,
        /id="bulkSelectAll"[\s\S]*?data-indeterminate="true"/
    );
    assert.match(html, /1 de 2/);

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

    assert.match(html, /id="bulkDueDate"/);
    assert.match(html, /id="openBulkMoveDialog"/);
    assert.match(html, /id="bulkMoveDialog"/);
    assert.match(html, /id="bulkMoveTarget"/);
    assert.match(html, /id="bulkMoveTasks"/);
    assert.match(
        html,
        /id="bulkMoveDialog"[\s\S]*?class="appDialogHeader"[\s\S]*?class="appDialogBody"[\s\S]*?class="appDialogActions"/
    );
    assert.match(
        html,
        /id="bulkDueTime"[\s\S]*?type="time"[\s\S]*?disabled/
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
        /id="bulkCompleteTasks"/
    );

    assert.match(
        html,
        /id="bulkArchiveTasks"/
    );

    assert.match(
        html,
        /id="bulkDeleteTasks"/
    );

    assert.match(
        html,
        /class="task [^"]*bulkSelectedTask/
    );

});

test("conserva visible la acción primaria del diálogo para mover", () => {
    const css = readFileSync(
        new URL("../styles.css", import.meta.url),
        "utf8"
    );

    assert.match(
        css,
        /\.bulkToolbar \.appDialog \.primaryAction\s*\{[\s\S]*?background:\s*var\(--color-accent\);[\s\S]*?color:\s*var\(--color-on-accent\);/
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
    assert.match(
        html,
        /id="bulkTagPickerSearch"/
    );
    assert.match(
        html,
        /data-value-class="bulkTagCheckbox"/
    );
    assert.match(
        html,
        /searchableMultiSelectCompact/
    );
    assert.match(
        html,
        /Agregar etiquetas/
    );
    assert.doesNotMatch(
        html,
        /type="checkbox"\s+class="bulkTagCheckbox"/
    );

});

test("agrupa las acciones masivas secundarias", () => {

    const html = render({
        selectedTaskIds:
            new Set(["task-1"])
    });

    assert.match(html, /bulkMoreActions/);
    assert.match(html, /Más acciones/);
    assert.match(html, /bulkPrimaryAction/);

});

test("muestra objetivos activos en un selector masivo buscable", () => {

    const html = render({
        selectedTaskIds:
            new Set(["task-1"]),
        goals: [{
            id: "goal-active",
            title: "Preparar trimestre",
            status: "ACTIVE"
        }, {
            id: "goal-archived",
            title: "Objetivo archivado",
            status: "ARCHIVED"
        }]
    });

    assert.match(html, /id="bulkGoals"/);
    assert.match(
        html,
        /id="bulkGoalPickerSearch"/
    );
    assert.match(
        html,
        /data-value-class="bulkGoalInput"/
    );
    assert.match(html, /Preparar trimestre/);
    assert.doesNotMatch(
        html,
        /Objetivo archivado/
    );

});

test("muestra restauración masiva en vistas históricas", () => {

    const archivedTask = new Task({
        id: "archived",
        title: "Proyecto archivado"
    });

    archivedTask.archive();

    const html = new TaskList().render(
        [archivedTask],
        "Archivadas",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(["archived"]),
        true,
        "ARCHIVED"
    );

    assert.match(
        html,
        /id="bulkRestoreTasks"/
    );

    assert.match(
        html,
        /Restaurar selección/
    );

    assert.doesNotMatch(
        html,
        /id="applyBulkChanges"/
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
