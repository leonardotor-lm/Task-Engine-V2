import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const enhancer = await readFile(
    new URL(
        "../src/ui/MobileTaskEditorCompactEnhancer.js",
        import.meta.url
    ),
    "utf8"
);

test("Mover sale de la grilla y queda en Opciones del editor móvil", () => {
    assert.match(
        enhancer,
        /grid\?\.querySelector\([\s\S]*"\.mobileTaskEditorMoveTool"/
    );
    assert.match(
        enhancer,
        /if \(move\) optionFields\.append\(move\)/
    );
    assert.doesNotMatch(
        enhancer,
        /moveButton\.remove\(\)/
    );
});
