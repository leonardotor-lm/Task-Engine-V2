import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TaskDisplayPreferences } from "../src/infrastructure/TaskDisplayPreferences.js";

const themeController = await readFile(
    new URL("../src/ui/ThemeController.js", import.meta.url),
    "utf8"
);
const indexHtml = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8"
);
const themeCss = await readFile(
    new URL("../styles/themes/retro-dark-2.css", import.meta.url),
    "utf8"
);
const pwaAssets = await readFile(
    new URL("../pwa-assets.js", import.meta.url),
    "utf8"
);

function createStorage() {
    const values = new Map();

    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };
}

test("Retro Dark 2 está disponible como tema independiente", () => {
    assert.match(themeController, /id:\s*"retro-dark-2"/);
    assert.match(themeController, /label:\s*"Retro Dark 2"/);
    assert.match(indexHtml, /styles\/themes\/retro-dark-2\.css/);
    assert.match(pwaAssets, /styles\/themes\/retro-dark-2\.css/);
});

test("Retro Dark 2 conserva la base visual y usa Lekton", () => {
    assert.match(themeCss, /family=Lekton:wght@400;700/);
    assert.match(themeCss, /:root\[data-theme="retro-dark-2"\]/);
    assert.match(themeCss, /--ui-font:\s*\n\s*"Lekton"/);
    assert.match(themeCss, /--color-surface-subtle:\s*#002b36/);
    assert.match(themeCss, /--color-accent:\s*#2aa198/);
});

test("Retro Dark 2 se guarda y recupera como preferencia válida", () => {
    const preferences = new TaskDisplayPreferences(createStorage());

    assert.equal(
        preferences.setTheme("retro-dark-2"),
        "retro-dark-2"
    );
    assert.equal(
        preferences.getTheme(),
        "retro-dark-2"
    );
});
