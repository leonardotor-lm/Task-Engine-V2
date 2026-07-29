import assert from "node:assert/strict";
import test from "node:test";
import { View } from "../src/core/View.js";
import { Sidebar } from "../src/ui/Sidebar.js";

const sidebar = new Sidebar();

test("la barra lateral prioriza ejecución antes que planificación", () => {
    const html = sidebar.render(View.TODAY);

    assert.ok(
        html.indexOf("Ejecución") <
            html.indexOf("Planificación")
    );
    assert.ok(
        html.indexOf('id="showToday"') <
            html.indexOf('id="showAll"')
    );
    assert.ok(
        html.indexOf('id="showAll"') <
            html.indexOf("Historial")
    );
});

test("historial y organización permanecen agrupados", () => {
    const html = sidebar.render(View.ARCHIVED);

    assert.match(
        html,
        /class="sidebarNavigationGroup"\s+open>[\s\S]*?<summary>Historial<\/summary>/
    );
    assert.match(
        html,
        /<summary>Organización<\/summary>[\s\S]*?id="manageAreas"[\s\S]*?id="manageContexts"[\s\S]*?id="manageTags"/
    );
});

test("los controles de tareas se ocultan fuera de sus vistas", () => {
    const taskHtml = sidebar.render(View.TODAY);
    const goalHtml = sidebar.render(View.GOALS);

    assert.match(taskHtml, /id="taskSearchForm"/);
    assert.doesNotMatch(goalHtml, /id="taskSearchForm"/);
    assert.doesNotMatch(goalHtml, /id="toggleBulkMode"/);
});

test("sincronización y copia quedan después de la navegación", () => {
    const html = sidebar.render(View.TODAY);

    assert.ok(
        html.indexOf("</nav>") <
            html.indexOf('class="sidebarSystemTools"')
    );
    assert.ok(
        html.indexOf('class="sidebarSystemTools"') <
            html.indexOf("Sincronización")
    );
});
