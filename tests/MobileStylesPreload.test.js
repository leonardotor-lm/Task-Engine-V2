import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8"
);

test("los estilos del editor móvil se cargan antes del primer render", () => {
    const moduleIndex = index.indexOf(
        '<script type="module" src="./src/main.js"></script>'
    );
    const compactIndex = index.indexOf(
        'href="styles/task-editor-mobile-compact.css"'
    );
    const densityIndex = index.indexOf(
        'href="styles/task-editor-mobile-density.css"'
    );
    const deviceFixesIndex = index.indexOf(
        'href="styles/task-editor-mobile-device-fixes.css"'
    );

    assert.ok(moduleIndex >= 0);
    assert.ok(compactIndex >= 0);
    assert.ok(densityIndex > compactIndex);
    assert.ok(deviceFixesIndex > densityIndex);

    assert.equal(
        (index.match(/task-editor-mobile-compact\.css/g) ?? []).length,
        1
    );
    assert.equal(
        (index.match(/task-editor-mobile-density\.css/g) ?? []).length,
        1
    );
    assert.equal(
        (index.match(/task-editor-mobile-device-fixes\.css/g) ?? []).length,
        1
    );
});
