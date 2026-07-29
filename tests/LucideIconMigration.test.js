import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const interfaceSources = [
    "MainView.js",
    "Sidebar.js",
    "SearchableMultiSelect.js",
    "TaskEditor.js",
    "TaskList.js"
].map(fileName =>
    fs.readFileSync(
        new URL(`../src/ui/${fileName}`, import.meta.url),
        "utf8"
    )
).join("\n");

test("los controles principales no dependen de glifos del sistema", () => {
    assert.doesNotMatch(
        interfaceSources,
        /[▶▼◷↻⋯✎×☰]/
    );
});

test("la atribución de Lucide y Feather queda incluida", () => {
    const notice = fs.readFileSync(
        new URL("../THIRD_PARTY_NOTICES.md", import.meta.url),
        "utf8"
    );

    assert.match(notice, /Lucide Icons/);
    assert.match(notice, /ISC License/);
    assert.match(notice, /Feather Icons/);
    assert.match(notice, /The MIT License/);
});
