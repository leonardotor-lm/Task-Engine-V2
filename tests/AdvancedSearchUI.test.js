import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import { Sidebar } from "../src/ui/Sidebar.js";

function renderSidebar({
    advanced = false,
    error = ""
} = {}) {

    return new Sidebar().render(
        View.TODAY,
        "",
        [],
        null,
        [],
        [],
        {},
        "MANUAL",
        false,
        false,
        "",
        0,
        false,
        "",
        null,
        false,
        false,
        false,
        null,
        false,
        advanced,
        error
    );

}

test("permite activar la búsqueda avanzada", () => {

    const html = renderSidebar({
        advanced: true
    });

    assert.match(
        html,
        /Búsqueda avanzada activa/
    );

    assert.match(
        html,
        /prioridad:alta AND fecha:hoy/
    );

    assert.doesNotMatch(
        html,
        /id="taskFilterForm"/
    );

});

test("mantiene la búsqueda simple como modo inicial", () => {

    const html = renderSidebar();

    assert.match(
        html,
        /Usar búsqueda avanzada/
    );

    assert.match(
        html,
        /placeholder="Buscar tareas"/
    );

    assert.match(
        html,
        /id="taskFilterForm"/
    );

});

test("muestra de forma segura los errores de sintaxis", () => {

    const html = renderSidebar({
        advanced: true,
        error: "El campo <script> no existe."
    });

    assert.match(
        html,
        /class="advancedSearchError"/
    );

    assert.doesNotMatch(
        html,
        /<script>/
    );

    assert.match(
        html,
        /&lt;script&gt;/
    );

});
