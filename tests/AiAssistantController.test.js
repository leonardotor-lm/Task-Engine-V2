import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
    normalizeAiQueryError
} from "../src/ui/AiAssistantController.js";

test("traduce la saturación temporal de Gemini a un mensaje claro", () => {
    assert.equal(
        normalizeAiQueryError(
            new Error(
                "This model is currently experiencing high demand. Please try again later."
            )
        ),
        "Gemini está saturado en este momento. Intentá nuevamente en unos minutos."
    );
});

test("conserva otros errores de IA para diagnóstico", () => {
    assert.equal(
        normalizeAiQueryError(
            new Error("API key not valid")
        ),
        "API key not valid"
    );
});

test("el asistente se integra en Planificación y usa un diálogo propio", async () => {
    const source = await fs.readFile(
        new URL(
            "../src/ui/AiAssistantController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(source, /Planificación/);
    assert.match(source, /openAiAssistant/);
    assert.match(source, /aiAssistantDialog/);
    assert.match(source, /showModal/);
    assert.match(source, /buildAiTaskContext/);
    assert.match(source, /gateway\.aiQuery/);
});

test("Configuración IA queda dedicada a configuración y conexión", async () => {
    const source = await fs.readFile(
        new URL(
            "../src/ui/AiSettingsController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(source, /Verificar conexión/);
    assert.doesNotMatch(source, /Consultar tareas/);
    assert.doesNotMatch(source, /aiQueryForm/);
});
