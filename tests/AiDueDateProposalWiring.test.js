import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("el controlador de propuestas de fechas se inicia desde main", async () => {
    const source = await fs.readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );

    assert.match(
        source,
        /AiDueDateProposalController/
    );
    assert.match(
        source,
        /aiDueDateProposalController\.start\(\);/
    );
});

test("la PWA incluye el controlador de propuestas de fechas", async () => {
    const source = await fs.readFile(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(
        source,
        /\.\/src\/ui\/AiDueDateProposalController\.js/
    );
});
