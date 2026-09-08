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

test("conserva el acceso compacto a Notas del editor de objetivos", () => {

    const body = { innerHTML: "" };
    let removed = false;
    let created = false;
    const section = {
        classList: {
            contains(name) {
                return name === "goalEditorTool";
            }
        },
        querySelector(selector) {
            return selector === "#notionGoalNotesBody"
                ? body
                : null;
        },
        remove() { removed = true; }
    };
    const drawer = {
        querySelector(selector) {
            return selector === ".editorNotionGoalSection"
                ? section
                : null;
        }
    };
    const documentRef = {
        querySelector(selector) {
            return selector === ".goalDrawer"
                ? drawer
                : null;
        },
        createElement() {
            created = true;
            return {};
        },
        getElementById() { return null; }
    };
    const controller =
        new NotionGoalNotesController({}, {
            documentRef,
            windowRef: null
        });

    controller.apply({
        selectedGoal: {
            id: "goal-1",
            status: "ACTIVE",
            notionPageId: null,
            notionPageUrl: null
        }
    });

    assert.equal(removed, false);
    assert.equal(created, false);
    assert.match(body.innerHTML, /Crear nota/);

});

test("actualiza dentro del acceso compacto los estados de Notion", () => {

    const controller =
        new NotionGoalNotesController({}, {
            documentRef: null,
            windowRef: null
        });

    controller.creatingGoalId = "goal-1";
    controller.errorGoalId = "goal-1";
    controller.errorMessage = "Error <temporal>";

    const html = controller.getBodyHtml({
        id: "goal-1",
        status: "ACTIVE",
        notionPageId: null,
        notionPageUrl: null
    });

    assert.match(html, /Creando nota…/);
    assert.match(html, /disabled/);
    assert.match(html, /Error &lt;temporal&gt;/);

});
