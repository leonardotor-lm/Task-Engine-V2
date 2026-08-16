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

test("Objetivos reutiliza filtros y orden sin agregar búsqueda lateral", () => {

    const html = new Sidebar().render(
        View.GOAL
    );

    assert.match(html, /id="openTaskTools"/);
    assert.match(html, /id="taskToolsDialog"/);
    assert.match(html, /id="taskFilterForm"/);
    assert.match(html, /id="taskSort"/);
    assert.doesNotMatch(html, /id="taskSearchForm"/);
    assert.doesNotMatch(html, /id="toggleBulkMode"/);

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

test("las secciones principales tienen separadores discretos", () => {

    assert.match(
        styles,
        /\.sidebarAreaGroup\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--color-border\)/
    );
    assert.match(
        styles,
        /\.customFiltersSection\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--color-border\)/
    );
    assert.match(
        styles,
        /\.sidebarListControls\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--color-border\)/
    );

});

test("los controles principales se perciben como botones", () => {

    assert.match(
        styles,
        /\.taskToolsButton\s*\{[\s\S]*?border:\s*1px solid var\(--color-border\)/
    );
    assert.match(
        styles,
        /#toggleBulkMode\s*\{[\s\S]*?border-color:\s*var\(--color-border\)/
    );
    assert.doesNotMatch(
        styles,
        /#toggleBulkMode\s*\{[\s\S]*?border-color:\s*transparent/
    );

});
