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

test("Apariencia forma parte del HTML que devuelve Sidebar", () => {

    const preferences =
        new TaskDisplayPreferences(
            new MemoryStorage()
        );
    let changeHandler = null;

    const sidebar = {
        render() {
            return `
                <section class="applicationTools settingsToolPanel">
                    <div class="applicationInstallTools">
                        <h3>Instalación</h3>
                    </div>
                </section>
            `;
        }
    };

    const app = {
        taskDisplayPreferences: preferences,
        mainView: { sidebar },
        renderCalls: 0,
        render() {
            this.renderCalls += 1;
        }
    };

    const documentRef = {
        documentElement: {
            dataset: {}
        },
        addEventListener(type, handler) {
            if (type === "change") {
                changeHandler = handler;
            }
        }
    };

    const controller = new ThemeController(
        app,
        { documentRef }
    );

    controller.start();

    const html = sidebar.render();

    assert.match(html, /themePreferenceControl/);
    assert.match(html, /Apariencia/);
    assert.match(html, /Tema visual/);
    assert.match(html, /value="default"/);
    assert.match(html, /value="paper"/);
    assert.match(html, /Papel/);
    assert.match(html, /value="high-contrast"/);
    assert.match(html, /Alto contraste/);
    assert.match(html, /value="dark"/);
    assert.match(html, /Oscuro/);
    assert.match(html, /value="retro-dark"/);
    assert.match(html, /Retro Dark/);
    assert.match(html, /value="retrofuture"/);
    assert.match(html, /Retrofuturo/);
    assert.match(html, /selected/);
    assert.ok(
        html.indexOf("Apariencia") <
        html.indexOf("Instalación")
    );

    changeHandler({
        target: {
            id: "applicationTheme",
            value: "high-contrast"
        }
    });

    assert.equal(
        preferences.getTheme(),
        "high-contrast"
    );
    assert.equal(
        documentRef.documentElement.dataset.theme,
        "high-contrast"
    );
    assert.equal(app.renderCalls, 1);

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
