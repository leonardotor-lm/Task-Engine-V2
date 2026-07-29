import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const editor = await readFile(
    new URL(
        "../src/ui/TaskEditor.js",
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

test("el editor prioriza la información principal", () => {

    assert.match(
        editor,
        /class="editorSection editorPrimarySection"\s+open/
    );

    assert.match(
        editor,
        /id="taskDescriptionEdit"\s+rows="4"/
    );

});

test("el editor distingue acciones principales y destructivas", () => {

    assert.match(
        styles,
        /#saveTask\s*\{[\s\S]*?background:\s*var\(--color-accent\)/
    );

    assert.match(
        styles,
        /#deleteTask\s*\{[\s\S]*?color:\s*var\(--color-danger\)/
    );

});
