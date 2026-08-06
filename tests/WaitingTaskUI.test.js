import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const controller = await readFile(
    new URL(
        "../src/ui/WaitingController.js",
        import.meta.url
    ),
    "utf8"
);

const main = await readFile(
    new URL("../src/main.js", import.meta.url),
    "utf8"
);

const styles = await readFile(
    new URL("../waiting.css", import.meta.url),
    "utf8"
);

test("incorpora la vista En espera y el control del editor", () => {

    assert.match(controller, /showWaiting/);
    assert.match(controller, /En espera/);
    assert.match(controller, /taskIsWaiting/);
    assert.match(controller, /waitingTaskBadge/);
    assert.match(main, /WaitingController/);

});

test("permite mostrar tareas en espera dentro de un área", () => {

    assert.match(controller, /toggleWaitingInArea/);
    assert.match(controller, /Mostrar en espera/);
    assert.match(controller, /Ocultar en espera/);

});

test("documenta el criterio en el modal", () => {

    assert.match(
        controller,
        /data-waiting-search-reference/
    );
    assert.match(controller, /enEspera \(sí\/no\)/);

});

test("incluye estilos adaptados para el control", () => {

    assert.match(styles, /\.waitingTaskEditorField/);
    assert.match(styles, /\.waitingTaskBadge/);
    assert.match(styles, /@media \(max-width: 760px\)/);

});
