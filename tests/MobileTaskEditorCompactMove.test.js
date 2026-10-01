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

test("Opciones abre Mover como un panel independiente del editor móvil", () => {
    assert.match(
        enhancer,
        /grid\?\.querySelector\([\s\S]*"\.mobileTaskEditorMoveTool"/
    );
    assert.match(
        enhancer,
        /optionFields\.append\(moveButton\)/
    );
    assert.doesNotMatch(
        enhancer,
        /optionFields\.append\(move\)/
    );
    assert.match(enhancer, /drawer\.append\(move\)/);
    assert.match(enhancer, /configureTransient\(moveDetails, moveBody, "Mover"\)/);
});
