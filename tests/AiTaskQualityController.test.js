import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
    AiTaskQualityController,
    parseTaskQualityFindings
} from "../src/ui/AiTaskQualityController.js";

function task(overrides = {}) {
    return {
        id: "task-1",
        title: "Preparar informe",
        status: "PENDING",
        areaId: "area-1",
        contextId: null,
        tagIds: [],
        isProject: false,
        parentTaskId: null,
        ...overrides
    };
}

test("acepta hallazgos válidos y exige dos tareas para duplicados", () => {
    const tasks = [
        task(),
        task({
            id: "task-2",
            title: "Hacer informe"
        })
    ];
    const answer = JSON.stringify({
        findings: [
            {
                type: "DUPLICATE",
                taskIds: ["task-1", "task-2"],
                reason: "Parecen representar el mismo resultado.",
                recommendation: "Revisar si conviene conservar una sola."
            },
            {
                type: "AMBIGUOUS",
                taskIds: ["task-1"],
                reason: "El resultado esperado no queda claro.",
                recommendation: "Precisar qué informe hay que preparar."
            }
        ]
    });

    const findings = parseTaskQualityFindings(
        answer,
        tasks
    );

    assert.equal(findings.length, 2);
    assert.deepEqual(
        findings[0].taskIds,
        ["task-1", "task-2"]
    );
    assert.equal(findings[1].type, "AMBIGUOUS");
});

test("descarta IDs inventados, categorías inválidas y proyectos ya existentes", () => {
    const tasks = [
        task(),
        task({
            id: "project-1",
            title: "Mudanza",
            isProject: true
        })
    ];
    const answer = JSON.stringify({
        findings: [
            {
                type: "DUPLICATE",
                taskIds: ["task-1", "inventada"],
                reason: "Duplicadas",
                recommendation: "Unificar"
            },
            {
                type: "UNKNOWN",
                taskIds: ["task-1"],
                reason: "Otro",
                recommendation: "Otro"
            },
            {
                type: "TOO_LARGE",
                taskIds: ["project-1"],
                reason: "Compleja",
                recommendation: "Dividir"
            }
        ]
    });

    assert.deepEqual(
        parseTaskQualityFindings(answer, tasks),
        []
    );
});

test("el contexto incluye sólo tareas activas e identifica entidades para diagnóstico", () => {
    const tasks = [
        task(),
        task({
            id: "inbox-1",
            title: "Llamar",
            status: "INBOX",
            areaId: null
        }),
        task({
            id: "done-1",
            status: "COMPLETED"
        })
    ];
    const app = {
        taskService: {
            repository: {
                getAll: () => tasks
            }
        },
        areaService: {
            getAllAreas: () => [
                { id: "area-1", name: "Trabajo" }
            ]
        },
        contextService: {
            getAllContexts: () => []
        },
        tagService: {
            getAllTags: () => []
        },
        aiPreferences: {
            getProvider: () => "gemini",
            getModel: () => "gemini-3.7-flash"
        }
    };
    const controller = new AiTaskQualityController(
        app,
        { documentRef: null }
    );

    const context = controller.buildContext();

    assert.equal(context.requestType, "taskQualityAudit");
    assert.equal(context.tasks.length, 2);
    assert.deepEqual(
        context.tasks.map(item => item.taskId),
        ["task-1", "inbox-1"]
    );
});

test("el diagnóstico queda cableado en main y en los assets de la PWA", () => {
    const main = fs.readFileSync(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const pwaAssets = fs.readFileSync(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(main, /AiTaskQualityController/);
    assert.match(main, /aiTaskQualityController\.start\(\)/);
    assert.match(
        pwaAssets,
        /\.\/src\/ui\/AiTaskQualityController\.js/
    );
});
