import test from "node:test";
import assert from "node:assert/strict";

import {
    SearchableMultiSelect
} from "../src/ui/SearchableMultiSelect.js";

test("muestra seleccionadas como chips y oculta las casillas", () => {

    const html = new SearchableMultiSelect().render({
        id: "taskTags",
        label: "Etiquetas",
        options: [
            {
                value: "tag-1",
                label: "Importante",
                color: "#ff0000"
            },
            {
                value: "tag-2",
                label: "Compras"
            }
        ],
        selectedValues: ["tag-1"],
        valueClass: "taskTag",
        emptyMessage: "No hay etiquetas."
    });

    assert.match(html, /Seleccionadas:/);
    assert.match(html, /Importante/);
    assert.match(html, /class="taskTag"/);
    assert.match(
        html,
        /class="searchableMultiSelectColor"/
    );
    assert.match(html, /id="taskTagsSearch"/);
    assert.doesNotMatch(
        html,
        /type="checkbox"/
    );

});

test("limita la lista buscable a seis filas", () => {

    const html = new SearchableMultiSelect().render({
        id: "taskGoals",
        label: "Objetivos",
        options: Array.from(
            { length: 20 },
            (_, index) => ({
                value: String(index),
                label: `Objetivo ${index}`
            })
        ),
        selectedValues: [],
        valueClass: "taskGoal",
        emptyMessage: "No hay objetivos."
    });

    assert.match(html, /size="6"/);

});

test("escapa las opciones y las etiquetas", () => {

    const html = new SearchableMultiSelect().render({
        id: "safePicker",
        label: "<Etiquetas>",
        options: [{
            value: "tag-1",
            label: "<script>"
        }],
        selectedValues: ["tag-1"],
        valueClass: "taskTag",
        emptyMessage: "Vacío"
    });

    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);

});
