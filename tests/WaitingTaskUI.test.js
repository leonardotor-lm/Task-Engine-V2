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
    new URL("../styles/waiting.css", import.meta.url),
    "utf8"
);

const taskInterfaceStyles = await readFile(
    new URL(
        "../styles/task-interface.css",
        import.meta.url
    ),
    "utf8"
);

test("incorpora la vista En espera y el control del editor", () => {

    assert.match(controller, /showWaiting/);
    assert.match(controller, /En espera/);
    assert.match(controller, /taskIsWaiting/);
    assert.match(controller, /waitingTaskIndicator/);
    assert.match(controller, /\.taskMeta/);
    assert.match(controller, /Icon\.render\(\s*"hand"/);
    assert.match(main, /WaitingController/);

});

test("permite mostrar tareas en espera dentro de un área", () => {

    assert.match(controller, /toggleWaitingInArea/);
    assert.match(controller, /Mostrar en espera/);
    assert.match(controller, /Ocultar en espera/);
    assert.match(
        controller,
        /taskContextToolbarWaitingIcon[\s\S]*?Icon\.render\("hand"\)/
    );
    assert.match(
        controller,
        /setAttribute\("aria-label", label\)/
    );
    assert.match(
        controller,
        /setAttribute\([\s\S]*?"aria-pressed"/
    );

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
    assert.match(styles, /\.waitingTaskIndicator/);
    assert.match(styles, /color:\s*var\(--color-warning\)/);
    assert.match(styles, /@media \(max-width: 760px\)/);
    assert.match(
        taskInterfaceStyles,
        /@media \(max-width: 760px\)[\s\S]*?\.taskContextToolbarWaiting\s*\{[\s\S]*?width:\s*44px;/
    );
    assert.match(
        taskInterfaceStyles,
        /\.taskContextToolbarWaitingLabel\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?clip:\s*rect\(0, 0, 0, 0\);/
    );

});
