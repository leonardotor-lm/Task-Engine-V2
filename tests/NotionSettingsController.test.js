import test from "node:test";
import assert from "node:assert/strict";
import {
    NotionSettingsController
} from "../src/ui/NotionSettingsController.js";

function createApp({
    configured = true,
    response = {
        ok: true,
        configured: true,
        connected: true,
        dataSourceId: "data-source-1",
        dataSourceName: "Notas de Task Engine"
    }
} = {}) {

    const calls = [];

    return {
        calls,
        app: {
            syncConfig: {
                isConfigured: () => configured,
                get: () => ({
                    url: "https://script.google.com/demo",
                    token: "task-engine-token"
                })
            },
            syncEngine: {
                gateway: {
                    notionStatus: async options => {
                        calls.push(options);
                        return response;
                    }
                }
            }
        }
    };
}

test("el panel explica que el token queda en Apps Script", () => {

    const { app } = createApp();
    const controller =
        new NotionSettingsController(
            app,
            { documentRef: null }
        );

    controller.status = {
        ok: true,
        configured: false,
        connected: false,
        dataSourceId: "",
        dataSourceName: ""
    };

    const html = controller.getPanelHtml();

    assert.match(
        html,
        /TASK_ENGINE_NOTION_TOKEN/
    );
    assert.match(
        html,
        /TASK_ENGINE_NOTION_DATA_SOURCE_ID/
    );
    assert.match(
        html,
        /nunca se guarda ni se envía a este navegador/
    );

});

test("verifica Notion usando sólo la conexión de Task Engine", async () => {

    const { app, calls } = createApp();
    const controller =
        new NotionSettingsController(
            app,
            { documentRef: null }
        );

    const result = await controller.refresh(true);

    assert.equal(calls.length, 1);
    assert.deepEqual(
        calls[0],
        {
            url: "https://script.google.com/demo",
            token: "task-engine-token",
            validateRemote: true
        }
    );
    assert.equal(
        result.dataSourceName,
        "Notas de Task Engine"
    );
    assert.equal(
        controller.error,
        ""
    );

});

test("requiere la conexión de Apps Script antes de comprobar Notion", async () => {

    const { app, calls } = createApp({
        configured: false
    });
    const controller =
        new NotionSettingsController(
            app,
            { documentRef: null }
        );

    const result = await controller.refresh(true);

    assert.equal(result, null);
    assert.equal(calls.length, 0);
    assert.match(
        controller.error,
        /Configurá primero la conexión de sincronización/
    );

});
