import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { Task } from "../src/domain/Task.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";

const mainViewSource = fs.readFileSync(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);
const styles = fs.readFileSync(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("el editor incorpora una capa de cierre exterior", () => {
    const html = new TaskEditor().render(
        new Task({ title: "Tarea" })
    );

    assert.match(html, /id="taskEditorBackdrop"/);
    assert.match(html, /aria-label="Cerrar editor de tarea"/);
    assert.match(
        styles,
        /\.taskEditorBackdrop\s*\{[\s\S]*?position:\s*fixed[\s\S]*?z-index:\s*19/
    );
    assert.match(
        styles,
        /@media \(max-width: 760px\)[\s\S]*?\.taskEditorBackdrop\s*\{[\s\S]*?display:\s*none/
    );
});

test("escape y la capa reutilizan la confirmación de descarte", () => {
    assert.match(
        mainViewSource,
        /bindTaskEditorDismissal\(task\)[\s\S]*?confirmDiscardTaskChanges\(task\)[\s\S]*?taskEditorBackdrop[\s\S]*?event\.key !== "Escape"/
    );
    assert.match(
        mainViewSource,
        /document\.querySelector\("dialog\[open\]"\)/
    );
    assert.match(
        mainViewSource,
        /clearTaskEditorEscapeBinding\(\)[\s\S]*?removeEventListener/
    );
});
