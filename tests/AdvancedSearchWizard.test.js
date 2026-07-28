import test from "node:test";
import assert from "node:assert/strict";

import {
    appendAdvancedSearchClause,
    createAdvancedSearchClause,
    renderAdvancedSearchWizard
} from "../src/ui/AdvancedSearchWizard.js";

test("construye condiciones de texto y entidades", () => {

    assert.equal(
        createAdvancedSearchClause({
            criterion: "title",
            value: "evaluación trimestral"
        }),
        'titulo:"evaluación trimestral"'
    );

    assert.equal(
        createAdvancedSearchClause({
            criterion: "area",
            value: "Trabajo docente"
        }),
        'area:"Trabajo docente"'
    );

});

test("construye comparaciones numéricas", () => {

    assert.equal(
        createAdvancedSearchClause({
            criterion: "postponed",
            value: "3",
            comparison: ">"
        }),
        "posposiciones:>3"
    );

});

test("utiliza condiciones predefinidas de fecha", () => {

    assert.equal(
        createAdvancedSearchClause({
            criterion: "duePreset",
            value: 'fechaDentro:"7 dias"'
        }),
        'fechaDentro:"7 dias"'
    );

});

test("combina condiciones con Y, O y Y NO", () => {

    assert.equal(
        appendAdvancedSearchClause(
            "prioridad:alta",
            "fecha:hoy",
            "AND"
        ),
        "prioridad:alta AND fecha:hoy"
    );

    assert.equal(
        appendAdvancedSearchClause(
            "prioridad:alta",
            "fecha:hoy",
            "OR"
        ),
        "prioridad:alta OR fecha:hoy"
    );

    assert.equal(
        appendAdvancedSearchClause(
            "prioridad:alta",
            "etiqueta:Lectura",
            "AND NOT"
        ),
        "prioridad:alta AND NOT etiqueta:Lectura"
    );

});

test("una primera exclusión comienza con NOT", () => {

    assert.equal(
        appendAdvancedSearchClause(
            "",
            "etiqueta:Lectura",
            "AND NOT"
        ),
        "NOT etiqueta:Lectura"
    );

});

test("renderiza opciones reales de áreas, contextos y etiquetas", () => {

    const html = renderAdvancedSearchWizard({
        areas: [
            { id: "area-1", name: "Trabajo docente" }
        ],
        contexts: [
            { id: "context-1", name: "Escuela" }
        ],
        tags: [
            { id: "tag-1", name: "Importante" }
        ]
    });

    assert.match(
        html,
        /Construir búsqueda/
    );

    assert.match(
        html,
        /Trabajo docente/
    );

    assert.match(
        html,
        /Escuela/
    );

    assert.match(
        html,
        /Importante/
    );

    assert.match(
        html,
        /Agregar criterio/
    );

});

test("escapa los nombres de las entidades", () => {

    const html = renderAdvancedSearchWizard({
        areas: [
            {
                id: "unsafe",
                name: "<script>alert(1)</script>"
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
