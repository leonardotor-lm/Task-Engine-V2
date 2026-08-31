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
    new URL("../styles/themes/rose-2.css", import.meta.url),
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
            return values.has(key)
                ? values.get(key)
                : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };
}

test("Rosa 2 está disponible como tema independiente", () => {
    assert.match(themeController, /id:\s*"rose-2"/);
    assert.match(themeController, /label:\s*"Rosa 2"/);
    assert.match(indexHtml, /styles\/themes\/rose-2\.css/);
    assert.match(pwaAssets, /styles\/themes\/rose-2\.css/);
});

test("Rosa 2 conserva la base cromática de Rosa y usa Lexend", () => {
    assert.match(themeCss, /family=Lexend:wght@400;500;600;700/);
    assert.match(themeCss, /:root\[data-theme="rose-2"\]/);
    assert.match(themeCss, /--ui-font:\s*\n\s*"Lexend"/);
    assert.match(themeCss, /--color-surface-subtle:\s*#fff8fb/);
    assert.match(themeCss, /--color-accent:\s*#db2777/);
    assert.match(themeCss, /--interface-radius:\s*8px/);
});

test("Rosa 2 se puede guardar y recuperar como preferencia", () => {
    const preferences = new TaskDisplayPreferences(
        createStorage()
    );

    assert.equal(
        preferences.setTheme("rose-2"),
        "rose-2"
    );
    assert.equal(
        preferences.getTheme(),
        "rose-2"
    );
});
