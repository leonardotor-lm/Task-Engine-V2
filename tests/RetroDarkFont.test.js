import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(
    new URL(`../${path}`, import.meta.url),
    "utf8"
);

test("Retro Dark usa IBM Plex Mono con fallback local", async () => {

    const css = await read(
        "styles/themes/retro-dark.css"
    );

    assert.match(
        css,
        /fonts\.googleapis\.com\/css2\?family=IBM\+Plex\+Mono/
    );
    assert.match(
        css,
        /--ui-font:[\s\S]*"IBM Plex Mono"[\s\S]*ui-monospace/
    );

});

test("la CSP permite únicamente los orígenes necesarios para la fuente", async () => {

    const html = await read("index.html");

    assert.match(
        html,
        /style-src[^;]*https:\/\/fonts\.googleapis\.com/
    );
    assert.match(
        html,
        /font-src[^;]*https:\/\/fonts\.gstatic\.com/
    );

});

test("la PWA cachea las respuestas de Google Fonts tras usarlas", async () => {

    const serviceWorker = await read(
        "service-worker.js"
    );

    assert.match(
        serviceWorker,
        /https:\/\/fonts\.googleapis\.com/
    );
    assert.match(
        serviceWorker,
        /https:\/\/fonts\.gstatic\.com/
    );
    assert.match(
        serviceWorker,
        /CACHEABLE_EXTERNAL_ORIGINS/
    );

});
