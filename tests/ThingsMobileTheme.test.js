import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(
    new URL(path, import.meta.url),
    "utf8"
);

test("el tema Things móvil está registrado y cargado", async () => {

    const [controller, index] = await Promise.all([
        read("../src/ui/ThemeController.js"),
        read("../index.html")
    ]);

    assert.match(controller, /id: "things-mobile"/);
    assert.match(controller, /label: "Things móvil"/);
    assert.match(
        index,
        /styles\/themes\/things-mobile\.css/
    );

});

test("el tema Things móvil carga Inter y define una variante optimizada para celular", async () => {

    const css = await read(
        "../styles/themes/things-mobile.css"
    );

    assert.match(
        css,
        /family=Inter:wght@400;500;600;700/
    );
    assert.match(
        css,
        /--ui-font:\s*Inter,/
    );
    assert.match(css, /--color-accent: #3978f6;/);
    assert.match(css, /--color-surface: #ffffff;/);
    assert.match(css, /@media \(max-width: 760px\)/);
    assert.match(
        css,
        /:root\[data-theme="things-mobile"\] \.task \{[\s\S]*?border-bottom-color: transparent;/
    );
    assert.match(
        css,
        /:root\[data-theme="things-mobile"\] \.task \{[\s\S]*?font-size: 16px;/
    );

});
