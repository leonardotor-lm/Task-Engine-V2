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
        html.indexOf('id="showInbox"') <
            html.indexOf('id="showToday"')
    );
    assert.ok(
        html.indexOf('id="showToday"') <
            html.indexOf('id="showTomorrow"')
    );
    assert.ok(
        html.indexOf('id="showTomorrow"') <
            html.indexOf('id="showUpcoming"')
    );
    assert.ok(
        html.indexOf('id="showUpcoming"') <
            html.indexOf('id="showAll"')
    );
    assert.ok(
        html.indexOf('id="showAll"') <
            html.indexOf("Historial")
    );
});

test("muestra contadores en vistas temporales, todas y áreas", () => {

    const html = sidebar.render(
        View.TODAY,
        "",
        [
            {
                id: "area-1",
                name: "Trabajo",
                color: "#3b82f6"
            }
        ],
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
        false,
        "",
        [],
        null,
        {
            inbox: 2,
            today: 10,
            tomorrow: 3,
            upcoming: 7,
            all: 22,
            "area:area-1": 5
        }
    );

    assert.match(
        html,
        /id="showToday"[\s\S]*?Hoy[\s\S]*?\(10\)/
    );
    assert.match(
        html,
        /id="showTomorrow"[\s\S]*?Mañana[\s\S]*?\(3\)/
    );
    assert.match(
        html,
        /data-id="area-1"[\s\S]*?Trabajo[\s\S]*?\(5\)/
    );

});

test("historial permanece agrupado y organización pasa a configuración", () => {
    const html = sidebar.render(View.ARCHIVED);

    assert.match(
        html,
        /class="sidebarNavigationGroup"\s+open>[\s\S]*?<summary>Historial<\/summary>/
    );
    assert.match(
        html,
        /id="openSettings"[\s\S]*?Configuración/
    );
    assert.doesNotMatch(
        html,
        /<summary>Organización<\/summary>/
    );
});

test("los controles de tareas se ocultan fuera de sus vistas", () => {
    const taskHtml = sidebar.render(View.TODAY);
    const goalHtml = sidebar.render(View.GOALS);

    assert.match(taskHtml, /id="taskSearchForm"/);
    assert.doesNotMatch(goalHtml, /id="taskSearchForm"/);
    assert.doesNotMatch(goalHtml, /id="toggleBulkMode"/);
});

test("configuración queda después de la navegación", () => {
    const html = sidebar.render(View.TODAY);

    assert.ok(
        html.indexOf("</nav>") <
            html.indexOf('class="sidebarSystemTools"')
    );
    assert.ok(
        html.indexOf('class="sidebarSystemTools"') <
            html.indexOf('id="openSettings"')
    );
});
