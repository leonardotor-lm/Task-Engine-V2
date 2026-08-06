import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    TaskToolbarController
} from "../src/ui/TaskToolbarController.js";

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

test("la barra móvil y Áreas aparecen desplegadas inicialmente", () => {

    const controller = new TaskToolbarController(
        null,
        { storage: createStorage() }
    );

    assert.equal(
        controller.isMobileToolbarExpanded(),
        true
    );
    assert.equal(
        controller.isAreasSectionExpanded(),
        true
    );

});

test("recuerda el estado de la barra móvil y de Áreas", () => {

    const storage = createStorage();
    const controller = new TaskToolbarController(
        null,
        { storage }
    );

    controller.setMobileToolbarExpanded(false);
    controller.setAreasSectionExpanded(false);

    const restored = new TaskToolbarController(
        null,
        { storage }
    );

    assert.equal(
        restored.isMobileToolbarExpanded(),
        false
    );
    assert.equal(
        restored.isAreasSectionExpanded(),
        false
    );

});

test("la aplicación carga el controlador y sus estilos", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const index = await readFile(
        new URL("../index.html", import.meta.url),
        "utf8"
    );

    assert.match(
        main,
        /TaskToolbarController/
    );
    assert.match(
        main,
        /taskToolbarController\.start\(\)/
    );
    assert.match(
        index,
        /task-toolbar\.css/
    );

});
