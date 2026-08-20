import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
    new URL(
        "../styles/task-checkbox-alignment.css",
        import.meta.url
    ),
    "utf8"
);

test("la casilla se desplaza ópticamente hacia la línea del título", () => {

    assert.match(
        source,
        /\.taskHeader\s*>\s*\.taskCompleteCheckbox\s*\{[\s\S]*?transform:\s*translateY\(4px\);/
    );

});

test("la casilla y el desplegable compensan la ruta jerárquica anterior al título", () => {

    assert.match(
        source,
        /\.taskHeader:has\(\.taskHierarchyPath\)[\s\S]*?>\s*\.taskCompleteCheckbox,[\s\S]*?>\s*\.toggleSubtasks,[\s\S]*?>\s*\.toggleSubtasksSpacer\s*\{[\s\S]*?transform:\s*translateY\(20px\);/
    );

});
