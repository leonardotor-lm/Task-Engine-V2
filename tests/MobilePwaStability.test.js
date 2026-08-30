import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const serviceWorker = await readFile(
    new URL("../service-worker.js", import.meta.url),
    "utf8"
);

test("la PWA precarga las hojas críticas de la interfaz móvil", () => {
    for (const stylesheet of [
        "./styles/mobile-density.css",
        "./styles/task-editor-mobile-density.css",
        "./styles/task-editor-mobile-device-fixes.css"
    ]) {
        assert.ok(
            serviceWorker.includes(`"${stylesheet}"`),
            `Falta ${stylesheet} en el app shell móvil`
        );
    }

    assert.match(
        serviceWorker,
        /CACHE_NAME = `\$\{CACHE_PREFIX\}-v5`/
    );
});
