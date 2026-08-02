import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    SearchableMultiSelect
} from "../src/ui/SearchableMultiSelect.js";

const source = await readFile(
    new URL(
        "../src/ui/SearchableMultiSelect.js",
        import.meta.url
    ),
    "utf8"
);

const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

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
    assert.match(html, /id="taskTagsCancel"/);
    assert.match(html, />\s*Cancelar\s*</);
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

test("cierra el selector después de agregar una opción", () => {

    assert.match(
        source,
        /closeManager[\s\S]*?manager\.open = false;[\s\S]*?querySelector\("summary"\)[\s\S]*?add\.addEventListener\("click"[\s\S]*?closeManager\(\)/
    );

});

test("permite cancelar sin agregar una opción", () => {

    assert.match(
        source,
        /cancel\.addEventListener\([\s\S]*?"click",[\s\S]*?closeManager/
    );
    assert.match(
        source,
        /const closeManager[\s\S]*?search\.value = "";[\s\S]*?refresh\(\)/
    );

});

test("mantiene compactos los chips de acciones múltiples", () => {

    assert.match(
        styles,
        /\.bulkToolbar \.searchableMultiSelectChip\s*\{[\s\S]*?max-width:\s*180px;[\s\S]*?min-height:\s*28px;/
    );
    assert.match(
        styles,
        /\.searchableMultiSelectChip[\s\S]*?\.searchableMultiSelectRemove\s*\{[\s\S]*?width:\s*26px;[\s\S]*?min-height:\s*26px;/
    );

});
