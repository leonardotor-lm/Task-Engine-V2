import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
    new URL(
        "../google-apps-script/Code.gs",
        import.meta.url
    ),
    "utf8"
);

function loadBackend() {
    const context = { console };
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
}

test("Apps Script acepta tema y preferencias visuales futuras", () => {
    const backend = loadBackend();

    assert.doesNotThrow(() =>
        backend.validateDisplayPreferences_({
            sidebarTitle: "Mis tareas",
            theme: "muestrario",
            futureVisualPreference: true
        })
    );
});

test("Apps Script rechaza un tema visual mal formado", () => {
    const backend = loadBackend();

    assert.throws(
        () => backend.validateDisplayPreferences_({
            theme: "   "
        }),
        error =>
            error.code === "INVALID_SNAPSHOT" &&
            /tema visual inválido/.test(
                error.publicMessage
            )
    );
});

test("Apps Script conserva la validación del título lateral", () => {
    const backend = loadBackend();

    assert.throws(
        () => backend.validateDisplayPreferences_({
            sidebarTitle: "x".repeat(41),
            theme: "dark"
        }),
        error =>
            error.code === "INVALID_SNAPSHOT" &&
            /título lateral inválido/.test(
                error.publicMessage
            )
    );
});
