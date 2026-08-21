import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
    AiSidebarGroupController,
    AI_SIDEBAR_TOOL_IDS,
    PLANNING_TOOL_IDS
} from "../src/ui/AiSidebarGroupController.js";

function sidebarHtml() {
    return `
        <nav>
            <details class="customFiltersSection">
                <summary>Filtros personalizados</summary>
            </details>
            <div class="sidebarListControls"></div>
            <span class="sidebarSectionLabel">
                        Planificación
                    </span>
            <button id="showAll" class="sidebarButton">Todas</button>
            <button id="openAiAssistant" class="sidebarButton">Asistente IA</button>
            <button id="openAiPriorityProposal" class="sidebarButton">Proponer prioridades</button>
            <button id="openAiDueDateProposal" class="sidebarButton">Proponer fechas</button>
            <button id="openAiWaitingProposal" class="sidebarButton">Proponer En espera</button>
            <button id="openAiOrganizationProposal" class="sidebarButton">Proponer organización</button>
            <button id="openAiProjectProposal" class="sidebarButton">Proponer proyectos</button>
            <button id="openAiTaskQuality" class="sidebarButton">Revisar calidad</button>
            <button id="showProjects" class="sidebarButton">Proyectos</button>
            <button id="showCalendar" class="sidebarButton">Calendario</button>
            <button id="showGoals" class="sidebarButton">Objetivos</button>
            <button id="showStatistics" class="sidebarButton">Estadísticas</button>
            <details class="sidebarNavigationGroup">
                <summary>Historial</summary>
            </details>
        </nav>`;
}

test("agrupa todas las herramientas de IA y queda colapsado por defecto", () => {
    const sidebar = { render: () => sidebarHtml() };
    const controller = new AiSidebarGroupController(
        { mainView: { sidebar }, render() {} },
        { documentRef: null }
    );

    controller.start();
    const html = sidebar.render();

    assert.match(html, /id="aiSidebarTools"/);
    assert.match(html, />Asistencia con IA<\/summary>/);
    assert.doesNotMatch(
        html,
        /id="aiSidebarTools"[^>]*\sopen(?:\s|>)/
    );

    for (const id of AI_SIDEBAR_TOOL_IDS) {
        assert.equal(
            html.match(new RegExp(`id="${id}"`, "g"))?.length,
            1
        );
    }
});

test("convierte Planificación en grupo real y ordena sus vistas", () => {
    const sidebar = { render: () => sidebarHtml() };
    const controller = new AiSidebarGroupController(
        { mainView: { sidebar }, render() {} },
        { documentRef: null }
    );

    controller.start();
    const html = sidebar.render();

    assert.match(html, /id="sidebarPlanningGroup"/);
    assert.match(html, />Planificación<\/summary>/);
    assert.match(
        html,
        /id="sidebarPlanningGroup"[^>]*\sopen(?:\s|>)/
    );

    for (const id of PLANNING_TOOL_IDS) {
        assert.equal(
            html.match(new RegExp(`id="${id}"`, "g"))?.length,
            1
        );
    }

    const order = [
        "showAll",
        "showProjects",
        "showGoals",
        "showCalendar",
        "showStatistics"
    ].map(id => html.indexOf(`id="${id}"`));

    assert.deepEqual(order, [...order].sort((a, b) => a - b));
    assert.ok(
        html.indexOf('id="sidebarPlanningGroup"') <
        html.indexOf('id="aiSidebarTools"')
    );
    assert.ok(
        html.indexOf('id="aiSidebarTools"') <
        html.indexOf('>Historial</summary>')
    );
});

test("conserva los estados de Planificación e IA durante nuevos renders", () => {
    const sidebar = { render: () => sidebarHtml() };
    const controller = new AiSidebarGroupController(
        { mainView: { sidebar }, render() {} },
        { documentRef: null }
    );

    controller.start();
    controller.expanded = true;
    controller.planningExpanded = false;

    const html = sidebar.render();

    assert.match(
        html,
        /id="aiSidebarTools"[\s\S]*?\sopen>/
    );
    assert.doesNotMatch(
        html,
        /id="sidebarPlanningGroup"[^>]*\sopen(?:\s|>)/
    );
});

test("normaliza encabezados y deja un solo separador antes de Planificación", () => {
    const source = fs.readFileSync(
        new URL(
            "../src/ui/AiSidebarGroupController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /\.customFiltersSection > summary,[\s\S]*\.sidebarNavigationGroup > summary,[\s\S]*\.aiSidebarTools > summary,[\s\S]*\.sidebarPlanningGroup > summary/
    );
    assert.match(
        source,
        /\.sidebarPlanningGroup \{[\s\S]*border-top: 1px solid/
    );
    assert.match(
        source,
        /\.sidebarListControls \{[\s\S]*border-bottom: 0 !important/
    );
    assert.match(
        source,
        /\.customFiltersSection \{[\s\S]*border-bottom: 0 !important/
    );
});

test("reubica En espera antes de Estadísticas cuando WaitingController lo inyecta", () => {
    const source = fs.readFileSync(
        new URL(
            "../src/ui/AiSidebarGroupController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(source, /getElementById\?\.\(\s*"showWaiting"/);
    assert.match(source, /getElementById\?\.\(\s*"showStatistics"/);
    assert.match(source, /statistics\.before\(waiting\)/);
});

test("el agrupador queda cableado en main y en la PWA", () => {
    const main = fs.readFileSync(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const pwaAssets = fs.readFileSync(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(main, /AiSidebarGroupController/);
    assert.match(main, /aiSidebarGroupController\.start\(\)/);
    assert.match(
        pwaAssets,
        /\.\/src\/ui\/AiSidebarGroupController\.js/
    );
});
