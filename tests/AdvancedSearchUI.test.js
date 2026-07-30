import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { View } from "../src/core/View.js";
import { Sidebar } from "../src/ui/Sidebar.js";

const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

function renderSidebar({
    advanced = false,
    error = "",
    dialogOpen = false
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
        error,
        [],
        null,
        {},
        dialogOpen
    );

}

test("permite editar la búsqueda avanzada en un diálogo", () => {

    const html = renderSidebar({
        advanced: true,
        dialogOpen: true
    });

    assert.match(
        html,
        /Editar búsqueda avanzada/
    );

    assert.match(
        html,
        /prioridad:alta AND fecha:hoy/
    );

    assert.match(
        html,
        /id="advancedSearchDialog"/
    );

    assert.match(
        html,
        /id="advancedSearchForm"/
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
        />\s*Búsqueda avanzada\s*</
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

test("la búsqueda simple usa una lupa dentro del campo", () => {

    const html = renderSidebar();

    assert.match(
        html,
        /class="taskSearchField"[\s\S]*?class="taskSearchSubmit iconButton"[\s\S]*?<svg/
    );

    assert.doesNotMatch(
        html,
        />\s*Buscar\s*</
    );

    assert.match(
        styles,
        /\.taskSearch \.taskSearchField input\s*\{[\s\S]*?padding-left:\s*34px/
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


test("ofrece una referencia de criterios avanzados", () => {

    const html = renderSidebar({
        advanced: true
    });

    assert.match(
        html,
        /Ver criterios disponibles/
    );

    assert.match(
        html,
        /fechaDentro/
    );

    assert.match(
        html,
        /posposiciones/
    );

});
