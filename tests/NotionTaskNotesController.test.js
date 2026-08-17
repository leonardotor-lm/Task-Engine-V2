import test from "node:test";
import assert from "node:assert/strict";
import {
    NotionTaskNotesController
} from "../src/ui/NotionTaskNotesController.js";

test("prepara para Notion los metadatos visibles de la tarea", () => {

    const app = {
        areaService: {
            getAreaById: id =>
                id === "area-1"
                    ? { name: "Trabajo" }
                    : null
        },
        contextService: {
            getContextById: id =>
                id === "context-1"
                    ? { name: "PC" }
                    : null
        },
        tagService: {
            getTagById: id => ({
                "tag-1": { name: "Literatura" },
                "tag-2": { name: "Planificación" }
            })[id] ?? null
        }
    };

    const controller =
        new NotionTaskNotesController(app, {
            documentRef: null
        });

    const payload = controller.buildTaskPayload({
        id: "task-1",
        title: "Preparar programa",
        status: "PENDING",
        isProject: true,
        areaId: "area-1",
        contextId: "context-1",
        tagIds: ["tag-1", "tag-2"],
        completedAt: null
    });

    assert.deepEqual(payload, {
        id: "task-1",
        title: "Preparar programa",
        status: "PENDING",
        isProject: true,
        areaName: "Trabajo",
        contextNames: ["PC"],
        tagNames: [
            "Literatura",
            "Planificación"
        ],
        completedAt: null
    });

});

test("la sección vinculada abre la nota y ofrece desvincular", () => {

    const controller =
        new NotionTaskNotesController({}, {
            documentRef: null
        });

    const html = controller.getSectionHtml({
        id: "task-1",
        notionPageId: "page-1",
        notionPageUrl:
            "https://www.notion.so/page-1",
        isDeleted: () => false
    });

    assert.match(html, /Abrir nota/);
    assert.match(html, /Desvincular/);
    assert.match(
        html,
        /https:\/\/www\.notion\.so\/page-1/
    );

});
