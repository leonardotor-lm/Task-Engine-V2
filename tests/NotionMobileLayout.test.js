import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
    dirname(fileURLToPath(import.meta.url)),
    ".."
);

test("las notas de Notion conservan controles táctiles en móvil", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/goal-workspace.css"),
        "utf8"
    );

    assert.match(
        styles,
        /@media\s*\(max-width:\s*760px\)[\s\S]*?\.editorNotionSection/
    );
    assert.match(
        styles,
        /\.editorNotionGoalSection[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/
    );
    assert.match(
        styles,
        /\.editorNotionSection[\s\S]*?min-height:\s*44px/
    );
    assert.match(
        styles,
        /\.syncErrorHint[\s\S]*?overflow-wrap:\s*anywhere/
    );

});

test("al abrir Notas en móvil se muestra su contenido", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/goal-workspace.css"),
        "utf8"
    );

    assert.match(
        styles,
        /\.editorNotionSection\[open\]\s*>\s*\.editorSectionBody[\s\S]*?display:\s*block\s*!important/
    );
    assert.match(
        styles,
        /\.editorNotionGoalSection\[open\]\s*>\s*\.editorSectionBody[\s\S]*?display:\s*block\s*!important/
    );

});

test("tareas y objetivos mantienen la sección Notas colapsable en móvil", async () => {

    const [taskController, goalController] = await Promise.all([
        readFile(
            resolve(ROOT, "src/ui/NotionTaskNotesController.js"),
            "utf8"
        ),
        readFile(
            resolve(ROOT, "src/ui/NotionGoalNotesController.js"),
            "utf8"
        )
    ]);

    assert.match(
        taskController,
        /editorNotionSection[\s\S]*?mobileCollapsed/
    );
    assert.match(
        goalController,
        /editorNotionGoalSection[\s\S]*?mobileCollapsed/
    );
    assert.match(taskController, /Abrir nota/);
    assert.match(taskController, /Desvincular/);
    assert.match(goalController, /Abrir nota/);
    assert.match(goalController, /Desvincular/);

});
