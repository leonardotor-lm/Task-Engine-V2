import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Sidebar } from "../src/ui/Sidebar.js";
import { View } from "../src/core/View.js";

const styles = await readFile(
    new URL(
        "../styles.css",
        import.meta.url
    ),
    "utf8"
);

test("los filtros rápidos agrupan filtros y orden", () => {

    const html = new Sidebar().render(
        View.INBOX
    );

    assert.match(
        html,
        /id="openTaskTools"[\s\S]*?Filtros rápidos/
    );

    assert.match(
        html,
        /id="taskToolsDialog"/
    );

    assert.match(
        html,
        /id="taskSort"/
    );

    assert.match(
        html,
        /id="toggleCompletedTasks"/
    );

    assert.ok(
        html.indexOf("toggleBulkMode") <
        html.indexOf("openTaskTools")
    );

    assert.ok(
        html.indexOf("openTaskTools") <
        html.indexOf("toggleCompletedTasks")
    );

    assert.ok(
        html.indexOf("taskToolsDialog") <
        html.indexOf("toggleCompletedTasks")
    );

    assert.match(
        html,
        /id="toggleBulkMode"[\s\S]*?class="taskToolsButton/
    );

    assert.match(
        html,
        /id="toggleCompletedTasks"[\s\S]*?class="taskToolsButton/
    );

    assert.doesNotMatch(
        html,
        /id="toggleTaskMetadata"/
    );

    assert.match(
        html,
        /type="submit"\s+form="taskFilterForm"[\s\S]*?>\s*Aplicar/
    );

});

test("la búsqueda simple precede al acceso avanzado", () => {

    const html = new Sidebar().render(
        View.INBOX
    );

    assert.ok(
        html.indexOf("taskSearchForm") <
        html.indexOf("toggleAdvancedSearch")
    );

    assert.match(
        html,
        />\s*Búsqueda avanzada\s*</
    );

});

test("los controles usan una jerarquía visual compacta", () => {

    assert.match(
        styles,
        /\/\* Ajustes finales de búsqueda filtros y selección \*\//
    );

    assert.match(
        styles,
        /\.advancedSearchToggle\s*\{[\s\S]*?border:\s*0/
    );

});
