import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Task } from "../src/domain/Task.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";
import { TaskList } from "../src/ui/TaskList.js";

const mainViewSource = await readFile(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);
const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

const parent = new Task({
    id: "parent-1",
    title: "Proyecto anual"
});
const child = new Task({
    id: "child-1",
    title: "Preparar primera etapa",
    parentTaskId: parent.id
});

test("marca una subtarea con un ícono del sistema visual", () => {
    const html = new TaskList().render(
        [child],
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
        "2026-08-03",
        [parent, child]
    );

    assert.match(html, /class="hierarchyIcon childTaskIcon"/);
    assert.match(html, /class="icon subtaskHierarchyIcon"/);
    assert.doesNotMatch(html, /↳/);
    assert.match(
        styles,
        /\.childTaskIcon\s*\{[\s\S]*?display:\s*inline-flex;/
    );
});

test("muestra la ruta completa cuando una subtarea aparece aislada", () => {
    const grandchild = new Task({
        id: "grandchild-1",
        title: "Enviar <borrador>",
        parentTaskId: child.id
    });

    const html = new TaskList().render(
        [grandchild],
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
        "2026-08-16",
        [grandchild, parent, child]
    );

    assert.match(html, /class="taskHierarchyPath"/);
    assert.match(
        html,
        /Proyecto anual › Preparar primera etapa › Enviar &lt;borrador&gt;/
    );
});

test("omite la ruta cuando el padre ya forma parte de la lista", () => {
    const html = new TaskList().render(
        [parent, child],
        "Hoy",
        false,
        [],
        [],
        [],
        "",
        new Set([parent.id]),
        false,
        new Set(),
        false,
        "ACTIVE",
        true,
        "2026-08-16",
        [parent, child]
    );

    assert.doesNotMatch(html, /taskHierarchyPath/);
});

test("oculta la ruta junto con los detalles de la tarea", () => {
    const html = new TaskList().render(
        [child],
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
        false,
        "2026-08-16",
        [parent, child]
    );

    assert.doesNotMatch(html, /taskHierarchyPath/);
});

test("una tarea raíz nunca muestra ruta jerárquica", () => {
    const html = new TaskList().render(
        [parent],
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
        "2026-08-16",
        [parent]
    );

    assert.doesNotMatch(html, /taskHierarchyPath/);
});

test("la ruta larga se trunca sin desbordar la fila", () => {
    assert.match(
        styles,
        /\.taskHierarchyPath\s*\{[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;/
    );
});

test("el editor identifica y enlaza la tarea padre", () => {
    const html = new TaskEditor().render(
        child,
        [],
        [],
        [],
        [parent, child]
    );

    assert.match(html, /class="taskParentContext"/);
    assert.match(html, /Subtarea de:/);
    assert.match(html, /id="openParentTask"/);
    assert.match(html, /data-id="parent-1"/);
    assert.match(html, />\s*Proyecto anual\s*</);
});

test("abrir el padre protege los cambios sin guardar", () => {
    const start = mainViewSource.indexOf(
        '"openParentTask"'
    );
    const block = mainViewSource.slice(
        start,
        start + 700
    );

    assert.notEqual(start, -1);
    assert.match(block, /confirmDiscardTaskChanges/);
    assert.match(block, /callbacks\.onOpenProject/);
});
