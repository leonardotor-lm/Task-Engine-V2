import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import { Sidebar } from "../src/ui/Sidebar.js";

function renderSidebar({
    query = "",
    advanced = false,
    error = "",
    filters = [],
    currentId = null
} = {}) {

    return new Sidebar().render(
        View.ALL,
        query,
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
        filters,
        currentId
    );

}

test("permite guardar una consulta avanzada válida", () => {

    const html = renderSidebar({
        query: "prioridad:alta",
        advanced: true
    });

    assert.match(
        html,
        /id="saveCustomFilter"/
    );

});

test("no ofrece guardar búsquedas vacías o inválidas", () => {

    assert.doesNotMatch(
        renderSidebar({
            advanced: true
        }),
        /id="saveCustomFilter"/
    );

    assert.doesNotMatch(
        renderSidebar({
            query: "campo:valor",
            advanced: true,
            error: "Campo inválido"
        }),
        /id="saveCustomFilter"/
    );

});

test("muestra filtros personalizados en una sección plegable", () => {

    const html = renderSidebar({
        filters: [
            {
                id: "filter-1",
                name: "Urgentes",
                query: "prioridad:critica"
            }
        ],
        currentId: "filter-1"
    });

    assert.match(
        html,
        /Filtros personalizados/
    );

    assert.match(
        html,
        /class="showCustomFilter active"/
    );

    assert.match(
        html,
        /renameCustomFilter/
    );

    assert.match(
        html,
        /deleteCustomFilter/
    );

});

test("escapa nombre y consulta del filtro", () => {

    const html = renderSidebar({
        filters: [
            {
                id: "unsafe",
                name: "<script>Filtro</script>",
                query: 'titulo:"<script>"'
            }
        ]
    });

    assert.doesNotMatch(
        html,
        /<script>/
    );

    assert.match(
        html,
        /&lt;script&gt;/
    );

});

test("oculta la sección cuando todavía no hay filtros", () => {

    assert.doesNotMatch(
        renderSidebar(),
        /customFiltersSection/
    );

});
