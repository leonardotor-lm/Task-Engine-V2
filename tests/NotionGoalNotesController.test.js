import test from "node:test";
import assert from "node:assert/strict";
import {
    NotionGoalNotesController
} from "../src/ui/NotionGoalNotesController.js";

test("prepara un objetivo para Notion con Tipo Objetivo", () => {

    const controller =
        new NotionGoalNotesController({}, {
            documentRef: null,
            windowRef: null
        });

    const payload = controller.buildGoalPayload({
        id: "goal-1",
        title: "Leer clásicos",
        status: "ACTIVE",
        completedAt: null
    });

    assert.deepEqual(payload, {
        id: "goal-1",
        title: "Leer clásicos",
        status: "ACTIVE",
        entityType: "Objetivo",
        areaName: "",
        contextNames: [],
        tagNames: [],
        completedAt: null,
        linked: true
    });

});

test("la sección vinculada ofrece abrir y desvincular", () => {

    const controller =
        new NotionGoalNotesController({}, {
            documentRef: null,
            windowRef: null
        });

    const html = controller.getSectionHtml({
        id: "goal-1",
        status: "ACTIVE",
        notionPageId: "page-1",
        notionPageUrl: "https://www.notion.so/page-1"
    });

    assert.match(html, /Abrir nota/);
    assert.match(html, /Desvincular/);
    assert.match(
        html,
        /https:\/\/www\.notion\.so\/page-1/
    );

});
