import test from "node:test";
import assert from "node:assert/strict";

import {
    SearchableSelect
} from "../src/ui/SearchableSelect.js";

test("renderiza un selector buscable y limitado", () => {

    const html = new SearchableSelect().render({
        id: "taskPicker",
        label: "Elegir tarea",
        options: [
            {
                value: "task-1",
                label: "Proyecto: Libro"
            },
            {
                value: "task-2",
                label: "Tarea: Revisar"
            }
        ]
    });

    assert.match(html, /id="taskPickerSearch"/);
    assert.match(html, /type="search"/);
    assert.match(html, /id="taskPicker"/);
    assert.match(html, /size="2"/);
    assert.match(html, /Proyecto: Libro/);

});

test("limita a seis opciones visibles", () => {

    const html = new SearchableSelect().render({
        id: "largePicker",
        label: "Elegir",
        options: Array.from(
            { length: 20 },
            (_, index) => ({
                value: String(index),
                label: `Elemento ${index}`
            })
        )
    });

    assert.match(html, /size="6"/);

});

test("normaliza mayúsculas y tildes", () => {

    const selector = new SearchableSelect();

    assert.equal(
        selector.normalize("  Próxima ÁREA "),
        "proxima area"
    );

});
