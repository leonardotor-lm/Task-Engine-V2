import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
    AiPreferences,
    AI_PROVIDERS,
    DEFAULT_AI_PROVIDER,
    DEFAULT_AI_MODEL
} from "../src/infrastructure/AiPreferences.js";

function createStorage() {
    const values = new Map();
    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };
}

test("usa Groq con GPT-OSS 20B como opción predeterminada", () => {
    const preferences = new AiPreferences(createStorage());

    assert.equal(DEFAULT_AI_PROVIDER, "groq");
    assert.equal(DEFAULT_AI_MODEL, "openai/gpt-oss-20b");
    assert.equal(preferences.getProvider(), "groq");
    assert.equal(preferences.getModel(), "openai/gpt-oss-20b");
    assert.equal(AI_PROVIDERS.length, 2);
});

test("persiste proveedor y sólo modelos compatibles con él", () => {
    const preferences = new AiPreferences(createStorage());

    assert.equal(
        preferences.setModel("openai/gpt-oss-120b"),
        "openai/gpt-oss-120b"
    );
    assert.equal(preferences.getModel(), "openai/gpt-oss-120b");

    assert.equal(preferences.setProvider("gemini"), "gemini");
    assert.equal(preferences.getModel(), "gemini-3.5-flash-lite");
    assert.equal(
        preferences.setModel("gemini-3.7-flash"),
        "gemini-3.7-flash"
    );
    assert.equal(
        preferences.setModel("openai/gpt-oss-20b"),
        "gemini-3.7-flash"
    );
});

test("Apps Script limita proveedor y modelo y soporta Groq", async () => {
    const ai = await fs.readFile(
        new URL("../google-apps-script/AI.gs", import.meta.url),
        "utf8"
    );
    const assistant = await fs.readFile(
        new URL("../src/ui/AiAssistantController.js", import.meta.url),
        "utf8"
    );

    assert.match(ai, /TASK_ENGINE_GROQ_API_KEY/);
    assert.match(ai, /openai\/gpt-oss-20b/);
    assert.match(ai, /openai\/gpt-oss-120b/);
    assert.match(ai, /normalizeAiProvider_/);
    assert.match(ai, /normalizeAiModel_/);
    assert.match(ai, /chat\/completions/);
    assert.match(ai, /Authorization: "Bearer "/);
    assert.match(ai, /context\.aiProvider/);
    assert.match(ai, /context\.aiModel/);
    assert.match(assistant, /aiPreferences\?\.getProvider/);
    assert.match(assistant, /aiPreferences\?\.getModel/);
});
