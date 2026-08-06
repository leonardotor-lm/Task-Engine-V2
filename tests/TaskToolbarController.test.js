import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    CompactTaskToolbarController
} from "../src/ui/CompactTaskToolbarController.js";

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

function createWindow(matches) {

    return {
        matchMedia() {
            return { matches };
        }
    };

}

test("la barra móvil aparece contraída y Áreas desplegada inicialmente", () => {

    const controller =
        new CompactTaskToolbarController(
            null,
            {
                storage: createStorage(),
                windowRef: createWindow(true)
            }
        );

    assert.equal(
        controller.isMobileToolbarExpanded(),
        false
    );
    assert.equal(
        controller.shouldExpandToolbar(),
        false
    );
    assert.equal(
        controller.isAreasSectionExpanded(),
        true
    );

});

test("recuerda el estado de la barra móvil y de Áreas", () => {

    const storage = createStorage();
    const windowRef = createWindow(true);
    const controller =
        new CompactTaskToolbarController(
            null,
            { storage, windowRef }
        );

    controller.setMobileToolbarExpanded(true);
    controller.setAreasSectionExpanded(false);

    const restored =
        new CompactTaskToolbarController(
            null,
            { storage, windowRef }
        );

    assert.equal(
        restored.isMobileToolbarExpanded(),
        true
    );
    assert.equal(
        restored.shouldExpandToolbar(),
        true
    );
    assert.equal(
        restored.isAreasSectionExpanded(),
        false
    );

});

test("la barra permanece abierta en escritorio sin alterar la preferencia móvil", () => {

    const storage = createStorage();
    const controller =
        new CompactTaskToolbarController(
            null,
            {
                storage,
                windowRef: createWindow(false)
            }
        );

    assert.equal(
        controller.shouldExpandToolbar(),
        true
    );

    controller.setMobileToolbarExpanded(true);

    assert.equal(
        controller.isMobileToolbarExpanded(),
        false
    );

});

test("la aplicación carga el controlador compacto y sus estilos", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const index = await readFile(
        new URL("../index.html", import.meta.url),
        "utf8"
    );
    const styles = await readFile(
        new URL(
            "../task-toolbar-layout.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        main,
        /CompactTaskToolbarController/
    );
    assert.match(
        main,
        /taskToolbarController\.start\(\)/
    );
    assert.match(
        index,
        /task-toolbar\.css/
    );
    assert.match(
        styles,
        /taskContextToolbarSummary/
    );
    assert.match(
        styles,
        /min-height:\s*34px/
    );

});
