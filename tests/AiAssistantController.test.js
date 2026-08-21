import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
    formatAiAnswer,
    normalizeAiQueryError
} from "../src/ui/AiAssistantController.js";

test("traduce la saturación temporal del proveedor a un mensaje claro", () => {
    assert.equal(
        normalizeAiQueryError(
            new Error(
                "This model is currently experiencing high demand. Please try again later."
            )
        ),
        "El proveedor de IA está saturado en este momento. Intentá nuevamente en unos minutos o elegí otro proveedor."
    );
});

test("traduce límites temporales del proveedor", () => {
    assert.equal(
        normalizeAiQueryError(
            new Error("Too many requests: rate limit reached")
        ),
        "Se alcanzó temporalmente el límite del proveedor de IA. Intentá nuevamente más tarde o elegí otro proveedor."
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

test("renderiza respuestas con estructura legible sin aceptar HTML arbitrario", () => {
    const html = formatAiAnswer([
        "## Próximos vencimientos",
        "",
        "* **Hoy:** Resolver esto",
        "* *Mañana:* Resolver aquello",
        "",
        "<script>alert('x')</script>"
    ].join("\n"));

    assert.match(html, /<h4>Próximos vencimientos<\/h4>/);
    assert.match(html, /<ul>/);
    assert.match(html, /<strong>Hoy:<\/strong>/);
    assert.match(html, /<em>Mañana:<\/em>/);
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>/);
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
    assert.match(source, /aiProvider/);
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
    assert.match(source, /aiProvider/);
    assert.doesNotMatch(source, /Consultar tareas/);
    assert.doesNotMatch(source, /aiQueryForm/);
});
