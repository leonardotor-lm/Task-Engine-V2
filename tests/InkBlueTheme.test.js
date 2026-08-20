import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    TaskDisplayPreferences
} from "../src/infrastructure/TaskDisplayPreferences.js";
import {
    ThemeController
} from "../src/ui/ThemeController.js";

class MemoryStorage {

    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.get(key) ?? null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }

}

test("Azul tinta aparece en el selector y se puede persistir", () => {

    const storage = new MemoryStorage();
    const preferences =
        new TaskDisplayPreferences(storage);

    const controller = new ThemeController(
        {
            taskDisplayPreferences: preferences
        },
        {
            documentRef: {
                documentElement: { dataset: {} }
            }
        }
    );

    assert.match(
        controller.renderThemeControl(),
        /value="ink-blue"[\s\S]*Azul tinta/
    );

    assert.equal(
        preferences.setTheme("ink-blue"),
        "ink-blue"
    );
    assert.equal(
        new TaskDisplayPreferences(storage).getTheme(),
        "ink-blue"
    );

});

test("Azul tinta se carga y queda disponible para la PWA", async () => {

    const [index, assets, theme] = await Promise.all([
        readFile(new URL("../index.html", import.meta.url), "utf8"),
        readFile(new URL("../pwa-assets.js", import.meta.url), "utf8"),
        readFile(
            new URL(
                "../styles/themes/ink-blue.css",
                import.meta.url
            ),
            "utf8"
        )
    ]);

    assert.match(index, /styles\/themes\/ink-blue\.css/);
    assert.match(assets, /styles\/themes\/ink-blue\.css/);
    assert.match(theme, /--color-accent:\s*#315f8c/);

});
