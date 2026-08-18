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
        { documentRef }
    );

    controller.start();

    assert.equal(
        documentRef.documentElement
            .dataset.theme,
        "default"
    );

});

test("monta Apariencia inmediatamente después del render real de MainView", () => {

    const preferences =
        new TaskDisplayPreferences(
            new MemoryStorage()
        );
    let mainViewRendered = false;
    let insertedControl = null;

    const select = {
        value: "",
        addEventListener() {}
    };

    const applicationTools = {
        querySelector() {
            return null;
        },
        insertBefore(control) {
            insertedControl = control;
        }
    };

    const documentRef = {
        documentElement: {
            dataset: {}
        },
        getElementById() {
            return null;
        },
        querySelector(selector) {
            if (
                selector === ".applicationTools" &&
                mainViewRendered
            ) {
                return applicationTools;
            }

            return null;
        },
        createElement() {
            return {
                id: "",
                className: "",
                innerHTML: "",
                querySelector(selector) {
                    return selector ===
                        "#applicationTheme"
                        ? select
                        : null;
                }
            };
        }
    };

    const mainView = {
        render() {
            mainViewRendered = true;
        }
    };

    const controller = new ThemeController(
        {
            taskDisplayPreferences:
                preferences,
            mainView
        },
        { documentRef }
    );

    controller.start();

    assert.equal(insertedControl, null);

    mainView.render({});

    assert.equal(
        insertedControl?.id,
        "themePreferenceControl"
    );
    assert.equal(
        insertedControl?.className,
        "applicationThemeTools"
    );
    assert.match(
        insertedControl?.innerHTML ?? "",
        /Apariencia/
    );
    assert.match(
        insertedControl?.innerHTML ?? "",
        /Tema visual/
    );
    assert.equal(select.value, "default");

});

test("inicia el controlador de tema después de App", async () => {

    const source = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );

    const appStart = source.lastIndexOf("app.start();");
    const themeStart = source.lastIndexOf(
        "themeController.start();"
    );

    assert.ok(appStart >= 0);
    assert.ok(themeStart >= 0);
    assert.ok(themeStart > appStart);

});
