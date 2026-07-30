import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const appSource = await readFile(
    new URL("../src/core/App.js", import.meta.url),
    "utf8"
);

const mainViewSource = await readFile(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);

const taskListSource = await readFile(
    new URL("../src/ui/TaskList.js", import.meta.url),
    "utf8"
);

test("el panel visual tiene apertura y cierre explícitos", () => {

    assert.match(
        appSource,
        /onOpenTaskTools:[\s\S]*?taskToolsDialogOpen = true/
    );
    assert.match(
        appSource,
        /onCloseTaskTools:[\s\S]*?taskToolsDialogOpen = false/
    );
    assert.match(
        mainViewSource,
        /id="taskToolsDialog"|taskToolsDialog/
    );

});

test("el panel es anclado en escritorio y modal en celular", () => {

    assert.match(
        mainViewSource,
        /max-width: 760px[\s\S]*?taskToolsDialog\.showModal\(\)[\s\S]*?taskToolsDialog\.show\(\)/
    );

});

test("aplicar o limpiar filtros cierra el panel", () => {

    assert.match(
        appSource,
        /onApplyTaskFilters:[\s\S]*?taskToolsDialogOpen = false/
    );
    assert.match(
        appSource,
        /onClearTaskFilters:[\s\S]*?taskToolsDialogOpen = false/
    );

});

test("el control de detalles deja el encabezado de tareas", () => {

    assert.doesNotMatch(
        taskListSource,
        /id="toggleTaskMetadata"/
    );

});
