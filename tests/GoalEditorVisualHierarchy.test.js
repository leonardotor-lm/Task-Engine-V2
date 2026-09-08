import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const editor = await readFile(
    new URL(
        "../src/ui/GoalEditor.js",
        import.meta.url
    ),
    "utf8"
);

const styles = await readFile(
    new URL(
        "../styles/goal-editor.css",
        import.meta.url
    ),
    "utf8"
);

test("el editor de objetivos usa una descripción compacta", () => {

    assert.match(
        editor,
        /id="goalDescriptionEdit"\s+rows="2"/
    );

});

test("el editor de objetivos carga su capa visual modular", async () => {

    const index = await readFile(
        new URL("../index.html", import.meta.url),
        "utf8"
    );
    const goalStyles = await readFile(
        new URL(
            "../styles/goal-editor.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(index, /styles\/goal-editor\.css/);
    assert.match(
        goalStyles,
        /\.goalEditorToolGrid\s*\{[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/
    );
    assert.match(
        goalStyles,
        /\.goalEditorFooter\s*\{[\s\S]*?position:\s*sticky/
    );
    assert.match(
        goalStyles,
        /\.goalEditorAdministrativeActions[\s\S]*?#deleteGoalFromEditor[\s\S]*?color:\s*var\(--color-danger\)/
    );
    assert.match(
        goalStyles,
        /\.goalEditorPrimaryActions[\s\S]*?button\[type="submit"\][\s\S]*?background:\s*var\(--color-accent\)/
    );

});

test("el editor jerarquiza sus acciones", () => {

    assert.match(
        styles,
        /\.goalEditorPrimaryActions[\s\S]*?button\[type="submit"\][\s\S]*?background:\s*var\(--color-accent\)/
    );

    assert.match(
        styles,
        /#deleteGoalFromEditor\s*\{[\s\S]*?color:\s*var\(--color-danger\)/
    );

});
