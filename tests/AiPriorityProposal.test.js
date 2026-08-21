import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
    AiPriorityProposalController
} from "../src/ui/AiPriorityProposalController.js";

function createApp() {
    const tasks = [
        {
            id: "pending-1",
            title: "Preparar clase",
            status: "PENDING",
            priority: 2,
            tagIds: []
        },
        {
            id: "done-1",
            title: "Ya hecha",
            status: "COMPLETED",
            priority: 3,
            tagIds: []
        }
    ];

    return {
        aiPreferences: {
            isEnabled: () => true,
            getProvider: () => "gemini",
            getModel: () => "gemini-3.7-flash"
        },
        taskService: {
            repository: {
                getAll: () => tasks
            }
        },
        areaService: { getAllAreas: () => [] },
        contextService: { getAllContexts: () => [] },
        tagService: { getAllTags: () => [] }
    };
}

test("la propuesta identifica inequívocamente tareas pendientes y conserva prioridad actual", () => {
    const controller = new AiPriorityProposalController(
        createApp(),
        { documentRef: null }
    );

    const context = controller.buildContext();

    assert.equal(context.requestType, "priorityProposal");
    assert.equal(context.tasks.length, 1);
    assert.equal(context.tasks[0].taskId, "pending-1");
    assert.equal(context.tasks[0].currentPriority, 2);
    assert.equal(context.aiProvider, "gemini");
    assert.equal(context.aiModel, "gemini-3.7-flash");
});

test("la primera etapa de propuestas no contiene ninguna escritura de tareas", async () => {
    const source = await fs.readFile(
        new URL(
            "../src/ui/AiPriorityProposalController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(source, /esta etapa no modifica ninguna tarea/);
    assert.match(source, /data-ai-priority-index/);
    assert.match(source, /Descartar propuesta/);
    assert.doesNotMatch(source, /taskService\?*\.update|repository\?*\.update|\.save\(/);
    assert.doesNotMatch(source, /Aplicar cambios|Aplicar propuesta/);
});

test("Apps Script valida IDs y prioridades antes de devolver una propuesta estructurada", async () => {
    const ai = await fs.readFile(
        new URL("../google-apps-script/AI.gs", import.meta.url),
        "utf8"
    );

    assert.match(ai, /requestType === "priorityProposal"/);
    assert.match(ai, /queryPriorityProposal_/);
    assert.match(ai, /parsePriorityProposals_/);
    assert.match(ai, /taskId debe copiar exactamente|Cada taskId debe copiar exactamente/);
    assert.match(ai, /priority < 0/);
    assert.match(ai, /priority > 4/);
    assert.match(ai, /priority === allowedTasks\[taskId\]/);
});

test("main y la PWA incluyen el controlador de propuestas", async () => {
    const main = await fs.readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const assets = await fs.readFile(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(main, /AiPriorityProposalController/);
    assert.match(main, /aiPriorityProposalController\.start\(\)/);
    assert.match(assets, /src\/ui\/AiPriorityProposalController\.js/);
});
