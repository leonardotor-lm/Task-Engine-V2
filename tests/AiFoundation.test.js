import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
    AiPreferences
} from "../src/infrastructure/AiPreferences.js";
import {
    AiSettingsController
} from "../src/ui/AiSettingsController.js";
import {
    CloudGateway
} from "../src/infrastructure/CloudGateway.js";

function createStorage() {
    const values = new Map();

    return {
        getItem(key) {
            return values.has(key)
                ? values.get(key)
                : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };
}

test("la asistencia con IA queda desactivada por defecto", () => {
    const preferences =
        new AiPreferences(createStorage());

    assert.equal(preferences.isEnabled(), false);
    preferences.setEnabled(true);
    assert.equal(preferences.isEnabled(), true);
    preferences.setEnabled(false);
    assert.equal(preferences.isEnabled(), false);
});

test("el panel explica que la IA es opcional y muestra la clave del proveedor seleccionado", () => {
    const storage = createStorage();
    const app = {
        aiPreferences: new AiPreferences(storage)
    };
    const controller =
        new AiSettingsController(
            app,
            { documentRef: null }
        );

    let html = controller.getPanelHtml();

    assert.match(html, /Usar asistencia con IA/);
    assert.match(html, /no envía datos/);
    assert.doesNotMatch(
        html,
        /TASK_ENGINE_(?:GEMINI|GROQ)_API_KEY/
    );

    app.aiPreferences.setEnabled(true);
    controller.status = {
        configured: false,
        connected: false,
        provider: "Groq",
        model: "openai/gpt-oss-20b"
    };
    html = controller.getPanelHtml();

    assert.match(
        html,
        /TASK_ENGINE_GROQ_API_KEY/
    );
    assert.doesNotMatch(
        html,
        /TASK_ENGINE_GEMINI_API_KEY/
    );
    assert.match(
        html,
        /nunca se envían al navegador/
    );
});

test("no consulta el servidor cuando la IA está desactivada", async () => {
    const storage = createStorage();
    let calls = 0;
    const app = {
        aiPreferences: new AiPreferences(storage),
        syncConfig: {
            isConfigured: () => true,
            get: () => ({
                url: "https://script.google.com/demo",
                token: "token"
            })
        },
        syncEngine: {
            gateway: {
                aiStatus: async () => {
                    calls += 1;
                    return {};
                }
            }
        }
    };
    const controller =
        new AiSettingsController(
            app,
            { documentRef: null }
        );

    const result = await controller.refresh(true);

    assert.equal(result, null);
    assert.equal(calls, 0);
});

test("verifica la IA mediante Apps Script sin exponer ninguna clave", async () => {
    const requests = [];
    const gateway = new CloudGateway({
        fetchFn: async (url, options) => {
            requests.push({ url, options });
            return {
                ok: true,
                json: async () => ({
                    ok: true,
                    configured: true,
                    connected: true,
                    provider: "Groq",
                    model: "openai/gpt-oss-20b"
                })
            };
        }
    });

    const result = await gateway.aiStatus({
        url: "https://script.google.com/macros/s/demo/exec?token=old",
        token: "task-engine-token",
        validateRemote: true
    });

    assert.equal(result.connected, true);
    assert.equal(requests.length, 1);
    assert.doesNotMatch(
        requests[0].url,
        /token=/
    );

    const body = JSON.parse(
        requests[0].options.body
    );

    assert.equal(body.action, "aiStatus");
    assert.equal(body.token, "task-engine-token");
    assert.equal(body.validateRemote, true);
    assert.equal(
        "apiKey" in body,
        false
    );
});

test("Apps Script conserva las claves de IA en propiedades y enruta aiStatus", () => {
    const code = fs.readFileSync(
        new URL(
            "../google-apps-script/Code.gs",
            import.meta.url
        ),
        "utf8"
    );
    const ai = fs.readFileSync(
        new URL(
            "../google-apps-script/AI.gs",
            import.meta.url
        ),
        "utf8"
    );
    const main = fs.readFileSync(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const pwaAssets = fs.readFileSync(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(code, /action === "aiStatus"/);
    assert.match(code, /getAiStatus_/);
    assert.match(
        ai,
        /TASK_ENGINE_GEMINI_API_KEY/
    );
    assert.match(
        ai,
        /TASK_ENGINE_GROQ_API_KEY/
    );
    assert.match(
        ai,
        /PropertiesService\.getScriptProperties/
    );
    assert.match(
        ai,
        /x-goog-api-key/
    );
    assert.match(
        ai,
        /Authorization/
    );
    assert.doesNotMatch(
        ai,
        /return\s*\{[\s\S]*apiKey\s*:/
    );
    assert.match(main, /AiSettingsController/);
    assert.match(main, /AiPreferences/);
    assert.match(
        pwaAssets,
        /src\/ui\/AiSettingsController\.js/
    );
    assert.match(
        pwaAssets,
        /src\/infrastructure\/AiPreferences\.js/
    );
});
