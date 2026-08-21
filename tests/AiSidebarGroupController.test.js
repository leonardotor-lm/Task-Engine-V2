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
            <details class="sidebarNavigationGroup sidebarAreaGroup">
                <summary>Áreas</summary>
            </details>
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
    assert.match(html, /Asistencia con IA/);
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

test("convierte Planificación en grupo real, muestra chevron SVG y ordena sus vistas", () => {
    const sidebar = { render: () => sidebarHtml() };
    const controller = new AiSidebarGroupController(
        { mainView: { sidebar }, render() {} },
        { documentRef: null }
    );

    controller.start();
    const html = sidebar.render();

    assert.match(html, /id="sidebarPlanningGroup"/);
    assert.match(
        html,
        /id="sidebarPlanningGroup"[\s\S]*?class="sidebarPlanningGroup sidebarNavigationGroup"/
    );
    assert.match(html, /sidebarGroupLabel">Planificación<\/span>/);
    assert.match(
        html,
        /sidebarGroupLabel">Planificación<\/span>[\s\S]*?<svg[\s\S]*?class="sidebarGroupChevron"[\s\S]*?<path[\s\S]*?d="M5 2\.75 L10\.25 8 L5 13\.25"/
    );
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
        html.indexOf('sidebarGroupLabel">Historial</span>')
    );
});

test("usa chevrons SVG explícitos en todos los títulos colapsables de la barra", () => {
    const sidebar = { render: () => sidebarHtml() };
    const controller = new AiSidebarGroupController(
        { mainView: { sidebar }, render() {} },
        { documentRef: null }
    );

    controller.start();
    const html = sidebar.render();

    for (const label of [
        "Filtros personalizados",
        "Áreas",
        "Planificación",
        "Asistencia con IA",
        "Historial"
    ]) {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.match(
            html,
            new RegExp(
                `sidebarGroupLabel">${escaped}<\\/span>[\\s\\S]*?<svg[\\s\\S]*?class="sidebarGroupChevron"`
            )
        );
    }

    assert.doesNotMatch(
        html,
        /<summary>\s*(Filtros personalizados|Áreas|Historial)\s*<\/summary>/
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
    assert.match(
        html,
        /sidebarGroupLabel">Planificación<\/span>[\s\S]*?sidebarGroupChevron/
    );
});

test("normaliza encabezados, fija chevrons y deja un solo separador antes de Planificación", () => {
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
    assert.match(source, /summary::after \{[\s\S]*content: none !important/);
    assert.match(source, /function renderChevron\(\)/);
    assert.match(source, /<svg[\s\S]*class="sidebarGroupChevron"/);
    assert.match(source, /position: relative !important/);
    assert.match(
        source,
        /\.sidebarGroupChevron \{[\s\S]*position: absolute !important;[\s\S]*right: 8px !important;[\s\S]*z-index: 2/
    );
    assert.match(
        source,
        /transform: translateY\(-50%\) rotate\(90deg\)/
    );
});

test("repara chevrons faltantes después del render final", () => {
    const source = fs.readFileSync(
        new URL(
            "../src/ui/AiSidebarGroupController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(source, /ensureDomChevrons\(\)/);
    assert.match(
        source,
        /#sidebarPlanningGroup > summary[\s\S]*?\.sidebarNavigationGroup > summary/
    );
    assert.match(
        source,
        /summary\.insertAdjacentHTML\?\.\([\s\S]*"beforeend"[\s\S]*renderChevron\(\)/
    );
    assert.match(source, /apply\(\) \{\s*this\.ensureDomChevrons\(\)/);
});

test("usa tokens del tema para mantener contraste en mensajes del chat de IA", () => {
    const source = fs.readFileSync(
        new URL(
            "../src/ui/AiSidebarGroupController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /\.aiAssistantDialog \.aiChatMessage \{[\s\S]*background: var\(--color-surface\) !important;[\s\S]*border-color: var\(--color-border\) !important;[\s\S]*color: var\(--color-text\) !important;/
    );
    assert.match(
        source,
        /\.aiAssistantDialog \.aiChatMessageLabel,[\s\S]*\.aiAssistantDialog \.aiChatMessage \.settingsHint \{[\s\S]*color: var\(--color-text-secondary\) !important;/
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
