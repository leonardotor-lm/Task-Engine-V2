import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("el asistente mantiene un chat de sesión con reinicio explícito", async () => {
    const source = await fs.readFile(
        new URL(
            "../src/ui/AiAssistantController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(source, /this\.messages = \[\]/);
    assert.match(source, /getChatHistory/);
    assert.match(source, /chatHistory/);
    assert.match(source, /MAX_CHAT_HISTORY_MESSAGES = 6/);
    assert.match(source, /newAiConversation/);
    assert.match(source, /Nueva conversación/);
    assert.match(source, /aiChatTranscript/);
    assert.match(source, /buildSelectionQuestion/);
});

test("una consulta nueva no hereda filtros previos pero un seguimiento referencial sí", async () => {
    const source = await fs.readFile(
        new URL(
            "../src/ui/AiAssistantController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(source, /isReferentialFollowUp/);
    assert.match(
        source,
        /if \(!isReferentialFollowUp\(question\)\)[\s\S]*return String\(question \|\| ""\)\.trim\(\)/
    );
    assert.match(
        source,
        /recentUserMessages[\s\S]*slice\(-2\)[\s\S]*join\("\\n"\)/
    );
});

test("Apps Script limita y normaliza el historial antes de enviarlo al proveedor", async () => {
    const ai = await fs.readFile(
        new URL(
            "../google-apps-script/AI.gs",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(ai, /MAX_CHAT_HISTORY_MESSAGES: 6/);
    assert.match(ai, /MAX_CHAT_MESSAGE_LENGTH: 1200/);
    assert.match(ai, /normalizeAiHistory_/);
    assert.match(ai, /context\.chatHistory/);
    assert.match(ai, /delete taskContext\.chatHistory/);
    assert.match(ai, /history\.forEach/);
    assert.match(ai, /message\.role === "assistant"[\s\S]*"model"/);
});

test("Gemini admite respuestas analíticas más largas y avisa si alcanza el máximo", async () => {
    const ai = await fs.readFile(
        new URL(
            "../google-apps-script/AI.gs",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(ai, /maxOutputTokens: 2400/);
    assert.match(ai, /finishReason === "MAX_TOKENS"/);
    assert.match(ai, /respuesta alcanzó el límite de longitud/i);
    assert.match(ai, /truncated: truncated/);
});
