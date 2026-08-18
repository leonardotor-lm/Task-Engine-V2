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

test("el controlador aplica el tema persistido al documento", () => {

    const preferences =
        new TaskDisplayPreferences(
            new MemoryStorage()
        );
    const documentRef = {
        documentElement: {
            dataset: {}
        },
        getElementById() {
            return null;
        },
        querySelector() {
            return null;
        }
    };

    const controller = new ThemeController(
        {
            taskDisplayPreferences:
                preferences
        },
        {
            documentRef,
            MutationObserverRef: null
        }
    );

    controller.start();

    assert.equal(
        documentRef.documentElement
            .dataset.theme,
        "default"
    );

});

test("el selector de Configuración usa la preferencia de tema", async () => {

    const source = await readFile(
        new URL(
            "../src/ui/ThemeController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /id = "themePreferenceControl"/
    );
    assert.match(
        source,
        /id="applicationTheme"/
    );
    assert.match(
        source,
        /preferences\.setTheme/
    );
    assert.match(
        source,
        /\.applicationTools/
    );

});
