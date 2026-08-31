import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const taskRowStyles = await readFile(
    new URL(
        "../styles/task-checkbox-alignment.css",
        import.meta.url
    ),
    "utf8"
);

test("el espaciado de las filas responde al breadcrumb y los metadatos", () => {
    assert.match(
        taskRowStyles,
        /\.task:not\(:has\(\.taskHierarchyPath\)\)[\s\S]*padding-top:\s*3px\s*!important/
    );
    assert.match(
        taskRowStyles,
        /\.task:not\(:has\(\.taskMeta\)\)[\s\S]*padding-bottom:\s*3px\s*!important/
    );
});

test("una tarea móvil sin breadcrumb ni metadatos no reserva 44 px", () => {
    assert.match(
        taskRowStyles,
        /@media \(max-width:\s*760px\)[\s\S]*\.task:not\(:has\(\.taskHierarchyPath\)\):not\(:has\(\.taskMeta\)\)[\s\S]*min-height:\s*0/
    );
});
