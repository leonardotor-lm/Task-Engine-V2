import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readProjectFile = path => readFile(
    new URL(`../${path}`, import.meta.url),
    "utf8"
);

test("el tema Retrofuturo usa la paleta violeta, naranja y coral", async () => {

    const theme = await readProjectFile(
        "styles/themes/retrofuture.css"
    );

    assert.match(theme, /data-theme="retrofuture"/);
    assert.match(theme, /#706ecb/i);
    assert.match(theme, /#f0831e/i);
    assert.match(theme, /#ea6b2b/i);
    assert.match(theme, /#d96352/i);
    assert.match(theme, /#685da5/i);
    assert.match(theme, /#2a1f30/i);
    assert.match(theme, /#93709f/i);
    assert.match(theme, /#922b55/i);

});

test("la página carga la hoja de estilo Retrofuturo", async () => {

    const index = await readProjectFile("index.html");

    assert.match(
        index,
        /styles\/themes\/retrofuture\.css/
    );

});
