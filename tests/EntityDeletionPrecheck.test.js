import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(
    new URL("../src/core/App.js", import.meta.url),
    "utf8"
);
const mainViewSource = await readFile(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);

test("expone comprobaciones de uso para las tres entidades", () => {
    assert.match(
        appSource,
        /onIsAreaInUse:[\s\S]*?hasTasksInArea/
    );
    assert.match(
        appSource,
        /onIsContextInUse:[\s\S]*?hasTasksInContext/
    );
    assert.match(
        appSource,
        /onIsTagInUse:[\s\S]*?hasTasksWithTag/
    );
});

test("configura la validación antes de eliminar cada entidad", () => {
    assert.match(
        mainViewSource,
        /name: "área"[\s\S]*?isInUse: this\.callbacks\.onIsAreaInUse/
    );
    assert.match(
        mainViewSource,
        /name: "contexto"[\s\S]*?isInUse:[\s\S]*?onIsContextInUse/
    );
    assert.match(
        mainViewSource,
        /name: "etiqueta"[\s\S]*?isInUse: this\.callbacks\.onIsTagInUse/
    );
});
