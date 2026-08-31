import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(relativePath) {
    return readFile(
        new URL(relativePath, import.meta.url),
        "utf8"
    );
}

test("el tema Rosa queda disponible y cargado por la aplicación", async () => {

    const [
        controller,
        preferences,
        index,
        pwaAssets
    ] = await Promise.all([
        read("../src/ui/ThemeController.js"),
        read("../src/infrastructure/TaskDisplayPreferences.js"),
        read("../index.html"),
        read("../pwa-assets.js")
    ]);

    assert.match(controller, /id: "rose"/);
    assert.match(controller, /label: "Rosa"/);
    assert.match(preferences, /"rose"/);
    assert.match(index, /styles\/themes\/rose\.css/);
    assert.match(pwaAssets, /styles\/themes\/rose\.css/);

});

test("el tema Rosa usa Nunito Sans y prioriza legibilidad móvil", async () => {

    const css = await read(
        "../styles/themes/rose.css"
    );

    assert.match(css, /family=Nunito\+Sans/);
    assert.match(css, /--color-accent: #db2777/);
    assert.match(css, /--color-surface-subtle: #fff8fb/);
    assert.match(css, /@media \(max-width: 760px\)/);
    assert.match(css, /--ui-font-size: 16px/);
    assert.match(css, /\.task \{[\s\S]*font-size: 15\.5px/);

});
