import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
    buildAiTaskContext
} from "../src/core/AiTaskContext.js";
import {
    CloudGateway
} from "../src/infrastructure/CloudGateway.js";

test("el contexto de IA excluye datos sensibles y estados fuera de alcance", () => {
    const context = buildAiTaskContext({
        today: "2026-08-21",
        areas: [{ id: "area-1", name: "Trabajo" }],
        contexts: [{ id: "ctx-1", name: "PC" }],
        tags: [{ id: "tag-1", name: "Urgente" }],
        tasks: [
            {
                id: "project-1",
                title: "Proyecto",
                status: "PENDING",
                isProject: true,
                priority: 2,
                tagIds: []
            },
            {
                id: "task-1",
                title: "Preparar informe",
                description: "texto privado",
                attachments: [{ name: "privado.pdf" }],
                notionPageUrl: "https://notion.so/privado",
                status: "PENDING",
                parentTaskId: "project-1",
                areaId: "area-1",
                contextId: "ctx-1",
                tagIds: ["tag-1"],
                priority: 3,
                isWaiting: true,
                dueDate: "2026-08-22"
            },
            {
                id: "task-2",
                title: "Archivada",
                status: "ARCHIVED",
                tagIds: []
            }
        ]
    });

    assert.equal(context.today, "2026-08-21");
    assert.equal(context.taskCount, 2);
    assert.equal(
        context.tasks.some(task => task.title === "Archivada"),
        false
    );

    const task = context.tasks.find(
        item => item.id === "task-1"
    );

    assert.equal(task.project, "Proyecto");
    assert.equal(task.area, "Trabajo");
    assert.equal(task.context, "PC");
    assert.deepEqual(task.tags, ["Urgente"]);
    assert.equal(task.priorityLabel, "Alta");
    assert.equal(task.isWaiting, true);
    assert.equal("description" in task, false);
    assert.equal("attachments" in task, false);
    assert.equal("notionPageUrl" in task, false);
});

test("el gateway envía la consulta y el contexto a Apps Script", async () => {
    const calls = [];
    const gateway = new CloudGateway({
        fetchFn: async (url, options) => {
            calls.push({ url, options });
            return {
                ok: true,
                json: async () => ({
                    ok: true,
                    answer: "Tenés una tarea vencida.",
                    taskCount: 1
                })
            };
        }
    });

    const context = {
        today: "2026-08-21",
        tasks: [{ id: "task-1", title: "Tarea" }]
    };

    const response = await gateway.aiQuery({
        url: "https://script.google.com/demo?token=legacy",
        token: "private-token",
        question: "¿Qué tengo vencido?",
        context
    });

    assert.equal(response.taskCount, 1);
    assert.equal(calls.length, 1);
    assert.equal(
        calls[0].url.includes("token="),
        false
    );

    const body = JSON.parse(calls[0].options.body);

    assert.equal(body.action, "aiQuery");
    assert.equal(body.token, "private-token");
    assert.equal(body.question, "¿Qué tengo vencido?");
    assert.deepEqual(body.context, context);
});

test("Apps Script enruta aiQuery y la operación se declara de solo lectura", async () => {
    const [code, ai] = await Promise.all([
        fs.readFile(
            new URL(
                "../google-apps-script/Code.gs",
                import.meta.url
            ),
            "utf8"
        ),
        fs.readFile(
            new URL(
                "../google-apps-script/AI.gs",
                import.meta.url
            ),
            "utf8"
        )
    ]);

    assert.match(
        code,
        /action === "aiQuery"[\s\S]*queryAi_\([\s\S]*body\.question[\s\S]*body\.context/
    );
    assert.match(
        ai,
        /Esta operación es de sólo lectura/
    );
    assert.match(
        ai,
        /:generateContent/
    );
    assert.doesNotMatch(
        ai,
        /updateTask|saveSnapshot_|trashAttachment_/
    );
});
