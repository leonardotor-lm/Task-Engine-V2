import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
    AiSidebarGroupController,
    AI_SIDEBAR_TOOL_IDS
} from "../src/ui/AiSidebarGroupController.js";

function sidebarHtml() {
    return `
        <nav>
            <span class="sidebarSectionLabel">
                        Planificación
                    </span>
            <button id="openAiAssistant" class="sidebarButton">Asistente IA</button>
            <button id="regularAction" class="sidebarButton">Acción normal</button>
            <button id="openAiPriorityProposal" class="sidebarButton">Proponer prioridades</button>
            <button id="openAiDueDateProposal" class="sidebarButton">Proponer fechas</button>
            <button id="openAiWaitingProposal" class="sidebarButton">Proponer En espera</button>
            <button id="openAiOrganizationProposal" class="sidebarButton">Proponer organización</button>
            <button id="openAiProjectProposal" class="sidebarButton">Proponer proyectos</button>
            <button id="openAiTaskQuality" class="sidebarButton">Revisar calidad</button>
        </nav>`;
}

test("agrupa todas las herramientas de IA y queda colapsado por defecto", () => {
    const sidebar = {
        render: () => sidebarHtml()
    };
    const app = {
        mainView: { sidebar },
        render() {}
    };
    const controller = new AiSidebarGroupController(
        app,
        { documentRef: null }
    );

    controller.start();
    const html = sidebar.render();

    assert.match(html, /id="aiSidebarTools"/);
    assert.match(html, />Asistencia con IA</);
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

    assert.match(html, /id="regularAction"/);
});

test("conserva el estado expandido durante nuevos renders", () => {
    const sidebar = {
        render: () => sidebarHtml()
    };
    const app = {
        mainView: { sidebar },
        render() {}
    };
    const controller = new AiSidebarGroupController(
        app,
        { documentRef: null }
    );

    controller.start();
    controller.expanded = true;

    assert.match(
        sidebar.render(),
        /id="aiSidebarTools"[\s\S]*?\sopen>/
    );
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
