import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    TaskToolbarLayoutController
} from "../src/ui/TaskToolbarLayoutController.js";

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

test("Áreas vuelve a mostrarse desplegada con la preferencia nueva", () => {

    const controller =
        new TaskToolbarLayoutController(
            null,
            { storage: createStorage() }
        );

    assert.equal(
        controller.readAreasExpanded(),
        true
    );

});

test("la preferencia nueva recuerda si Áreas fue contraída", () => {

    const storage = createStorage();
    const controller =
        new TaskToolbarLayoutController(
            null,
            { storage }
        );

    controller.writeAreasExpanded(false);

    assert.equal(
        controller.readAreasExpanded(),
        false
    );

});

test("la aplicación carga el refinamiento compacto de la barra", async () => {

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
        /TaskToolbarLayoutController/
    );
    assert.match(
        main,
        /taskToolbarLayoutController\.start\(\)/
    );
    assert.match(
        index,
        /task-toolbar-layout\.css/
    );
    assert.match(
        styles,
        /taskContextToolbarIconButton/
    );
    assert.match(
        styles,
        /sidebarAreaGroupVisible/
    );

});
