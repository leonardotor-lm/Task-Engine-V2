import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const loader = await readFile(
    new URL(
        "../src/ui/MobileTaskEditorCompactLoader.js",
        import.meta.url
    ),
    "utf8"
);

test("Mover no permanece en la grilla principal del editor móvil", () => {
    assert.match(
        loader,
        /function relocateMoveFallback\(\)/
    );
    assert.match(
        loader,
        /drawer\.querySelector\("\.mobileTaskEditorMoveTool"\)/
    );
    assert.match(
        loader,
        /drawer\.querySelectorAll\([\s\S]*"\.mobileTaskEditorToolButton"/
    );
    assert.match(
        loader,
        /options\.append\(moveButton\)/
    );
    assert.doesNotMatch(
        loader,
        /moveButton\.remove\(\)/
    );
});
