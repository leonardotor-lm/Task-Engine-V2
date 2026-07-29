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
        "../styles.css",
        import.meta.url
    ),
    "utf8"
);

test("el editor de objetivos usa una descripción compacta", () => {

    assert.match(
        editor,
        /id="goalDescriptionEdit"\s+rows="4"/
    );

});

test("el editor jerarquiza sus acciones", () => {

    assert.match(
        styles,
        /#goalEditorForm\s+\.goalEditorActions\s+button\[type="submit"\][\s\S]*?background:\s*var\(--color-accent\)/
    );

    assert.match(
        styles,
        /#deleteGoalFromEditor\s*\{[\s\S]*?color:\s*var\(--color-danger\)/
    );

});
