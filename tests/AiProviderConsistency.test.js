import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
    DEFAULT_AI_PROVIDER,
    DEFAULT_AI_MODEL
} from "../src/infrastructure/AiPreferences.js";

test("frontend y Apps Script comparten proveedor y modelo predeterminados", async () => {
    const source = await fs.readFile("google-apps-script/AI.gs", "utf8");

    assert.equal(DEFAULT_AI_PROVIDER, "gemini");
    assert.equal(DEFAULT_AI_MODEL, "gemini-3.7-flash");
    assert.match(source, /DEFAULT_PROVIDER:\s*"gemini"/);
    assert.match(
        source,
        /gemini:\s*\{[\s\S]*?DEFAULT_MODEL:\s*"gemini-3\.7-flash"/
    );
});

test("la interfaz no atribuye propuestas genéricas a Gemini", async () => {
    const files = [
        "src/ui/AiDueDateProposalController.js",
        "src/ui/AiOrganizationProposalController.js",
        "src/ui/AiPriorityProposalController.js",
        "src/ui/AiProjectProposalController.js",
        "src/ui/AiTaskQualityController.js",
        "src/ui/AiWaitingProposalController.js"
    ];

    for (const file of files) {
        const source = await fs.readFile(file, "utf8");
        assert.doesNotMatch(source, /Gemini propone/);
    }
});

test("Configuración usa el proveedor predeterminado centralizado", async () => {
    const source = await fs.readFile(
        "src/ui/AiSettingsController.js",
        "utf8"
    );

    assert.match(source, /DEFAULT_AI_PROVIDER/);
    assert.doesNotMatch(
        source,
        /getProvider\?\.\(\) \|\| "groq"/
    );
});
