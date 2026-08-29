import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const taskList = await readFile(
    new URL("../src/ui/TaskList.js", import.meta.url),
    "utf8"
);
const styles = await readFile(
    new URL(
        "../styles/mobile-task-toolbar.css",
        import.meta.url
    ),
    "utf8"
);

test("la selección múltiple conserva todas sus acciones existentes", () => {
    assert.match(taskList, /id="bulkPriority"/);
    assert.match(taskList, /id="bulkDueDate"/);
    assert.match(taskList, /id="bulkArea"/);
    assert.match(taskList, /id="bulkContext"/);
    assert.match(taskList, /id="bulkTags"/);
    assert.match(taskList, /id="bulkGoals"/);
    assert.match(taskList, /id="applyBulkChanges"/);
    assert.match(taskList, /id="openBulkMoveDialog"/);
    assert.match(taskList, /class="bulkMoreActions"/);
    assert.match(taskList, /id="clearBulkSelection"/);
});

test("en móvil la barra masiva se muestra compacta hasta abrir Opciones", () => {
    assert.match(styles, /@media \(max-width: 760px\)/);
    assert.match(
        styles,
        /\.bulkToolbar > \.bulkControl,[\s\S]*?#openBulkMoveDialog\s*\{\s*display:\s*none;/
    );
    assert.match(
        styles,
        /content:\s*"Opciones"/
    );
    assert.match(
        styles,
        /\.bulkToolbar:has\(> \.bulkMoreActions\[open\]\)[\s\S]*?> \.bulkControl,[\s\S]*?#openBulkMoveDialog[\s\S]*?display:\s*flex;/
    );
});

test("las acciones de estado permanecen accesibles dentro de Opciones", () => {
    assert.match(
        styles,
        /\.bulkToolbar > \.bulkMoreActions\[open\][\s\S]*?> \.bulkStateActions[\s\S]*?position:\s*static;/
    );
    assert.match(taskList, /id="bulkCompleteTasks"/);
    assert.match(taskList, /id="bulkArchiveTasks"/);
    assert.match(taskList, /id="bulkDeleteTasks"/);
});
