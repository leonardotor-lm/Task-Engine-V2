import test from "node:test";
import assert from "node:assert/strict";
import {
    NotionSettingsController
} from "../src/ui/NotionSettingsController.js";

test("muestra las actualizaciones pendientes de Notion", () => {

    const app = {
        notionSyncRetryState: {
            pendingCount: 2,
            lastError: "sin red"
        }
    };
    const controller = new NotionSettingsController(
        app,
        { documentRef: null }
    );

    controller.status = {
        configured: true,
        connected: true,
        dataSourceName: "Notas Task Engine",
        dataSourceId: "source-1"
    };

    const html = controller.getPanelHtml();

    assert.match(html, /Sincronización de notas/);
    assert.match(html, /2 pendientes/);
    assert.match(html, /Último error: sin red/);
    assert.match(html, /esperando reintento automático/);

});

test("muestra Notion al día cuando la cola está vacía", () => {

    const app = {
        notionSyncRetryState: {
            pendingCount: 0,
            lastError: null
        }
    };
    const controller = new NotionSettingsController(
        app,
        { documentRef: null }
    );

    const html = controller.getPanelHtml();

    assert.match(html, />Al día</);
    assert.match(
        html,
        /No hay actualizaciones pendientes para Notion/
    );

});
