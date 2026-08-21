import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
    AiPreferences,
    AI_MODELS,
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

test("usa Flash-Lite como modelo rápido predeterminado", () => {
    const preferences = new AiPreferences(createStorage());
    assert.equal(DEFAULT_AI_MODEL, "gemini-3.5-flash-lite");
    assert.equal(preferences.getModel(), DEFAULT_AI_MODEL);
    assert.equal(AI_MODELS.length, 2);
});

test("persiste sólo modelos permitidos", () => {
    const preferences = new AiPreferences(createStorage());
    assert.equal(
        preferences.setModel("gemini-3.7-flash"),
        "gemini-3.7-flash"
    );
    assert.equal(preferences.getModel(), "gemini-3.7-flash");
    assert.equal(
        preferences.setModel("modelo-no-permitido"),
        "gemini-3.7-flash"
    );
});

test("Apps Script limita el modelo solicitado a la lista permitida", async () => {
    const ai = await fs.readFile(
        new URL("../google-apps-script/AI.gs", import.meta.url),
        "utf8"
    );
    const assistant = await fs.readFile(
        new URL("../src/ui/AiAssistantController.js", import.meta.url),
        "utf8"
    );

    assert.match(ai, /gemini-3\.5-flash-lite/);
    assert.match(ai, /gemini-3\.7-flash/);
    assert.match(ai, /normalizeAiModel_/);
    assert.match(ai, /context\.aiModel/);
    assert.match(assistant, /aiPreferences\?\.getModel/);
});
