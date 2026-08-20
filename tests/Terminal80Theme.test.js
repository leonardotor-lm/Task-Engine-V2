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

test("Terminal 80 se puede guardar y aplicar como tema local", () => {

    const storage = new MemoryStorage();
    const preferences =
        new TaskDisplayPreferences(storage);
    const documentRef = {
        documentElement: {
            dataset: {}
        }
    };

    assert.equal(
        preferences.setTheme("terminal-80"),
        "terminal-80"
    );
    assert.equal(
        new TaskDisplayPreferences(storage)
            .getTheme(),
        "terminal-80"
    );

    const controller = new ThemeController(
        {
            taskDisplayPreferences:
                preferences
        },
        { documentRef }
    );

    controller.applyTheme("terminal-80");

    assert.equal(
        documentRef.documentElement.dataset.theme,
        "terminal-80"
    );

});

test("Terminal 80 aparece en Apariencia", () => {

    const preferences =
        new TaskDisplayPreferences(
            new MemoryStorage()
        );

    const controller = new ThemeController(
        {
            taskDisplayPreferences:
                preferences
        },
        {
            documentRef: {
                documentElement: {
                    dataset: {}
                }
            }
        }
    );

    const html = controller.renderThemeControl();

    assert.match(html, /value="terminal-80"/);
    assert.match(html, /Terminal 80/);

});

test("Terminal 80 se carga en index y se precachea para PWA", async () => {

    const [index, assets] = await Promise.all([
        readFile(
            new URL("../index.html", import.meta.url),
            "utf8"
        ),
        readFile(
            new URL("../pwa-assets.js", import.meta.url),
            "utf8"
        )
    ]);

    assert.match(
        index,
        /styles\/themes\/terminal-80\.css/
    );
    assert.match(
        assets,
        /\.\/styles\/themes\/terminal-80\.css/
    );

});
