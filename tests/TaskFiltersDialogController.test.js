import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    TaskFiltersDialogController
} from "../src/ui/TaskFiltersDialogController.js";

test("detecta clics fuera del diálogo y sobre su fondo", () => {

    const controller =
        new TaskFiltersDialogController(null, {
            documentRef: null
        });

    const inside = {};
    const outside = {};
    const dialog = {
        contains(target) {
            return target === inside;
        },
        getBoundingClientRect() {
            return {
                left: 100,
                right: 400,
                top: 100,
                bottom: 300
            };
        }
    };

    assert.equal(
        controller.isOutsideDialog(
            dialog,
            { target: inside }
        ),
        false
    );
    assert.equal(
        controller.isOutsideDialog(
            dialog,
            { target: outside }
        ),
        true
    );
    assert.equal(
        controller.isOutsideDialog(
            dialog,
            {
                target: dialog,
                clientX: 50,
                clientY: 150
            }
        ),
        true
    );
    assert.equal(
        controller.isOutsideDialog(
            dialog,
            {
                target: dialog,
                clientX: 200,
                clientY: 150
            }
        ),
        false
    );

});

test("carga el cierre accesible y elimina el título visible de Orden", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const controller = await readFile(
        new URL(
            "../src/ui/TaskFiltersDialogController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        main,
        /TaskFiltersDialogController/
    );
    assert.match(
        main,
        /taskFiltersDialogController\.start\(\)/
    );
    assert.match(controller, /event\.key !== "Escape"/);
    assert.match(controller, /pointerdown/);
    assert.match(controller, /onCloseTaskTools/);
    assert.match(controller, /removeVisibleSortLabel/);
    assert.match(controller, /aria-label/);

});
