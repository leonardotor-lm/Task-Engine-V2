import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
    assertAiStructuredResponseComplete,
    requireAiStructuredCollection
} from "../src/core/AiStructuredResponse.js";

test("requireAiStructuredCollection acepta una colección vacía válida", () => {
    assert.deepEqual(
        requireAiStructuredCollection({ proposals: [] }, "proposals"),
        []
    );
});

test("requireAiStructuredCollection rechaza colección ausente o de tipo incorrecto", () => {
    assert.throws(() => requireAiStructuredCollection({}, "proposals"), /formato inválido/);
    assert.throws(() => requireAiStructuredCollection({ proposals: {} }, "proposals"), /formato inválido/);
});

test("assertAiStructuredResponseComplete rechaza respuestas truncadas", () => {
    assert.throws(
        () => assertAiStructuredResponseComplete({ truncated: true }),
        /incompleta/
    );
    assert.doesNotThrow(() => assertAiStructuredResponseComplete({ truncated: false }));
});

test("los flujos estructurados usan la validación común", async () => {
    const files = [
        "src/ui/AiDueDateProposalController.js",
        "src/ui/AiWaitingProposalController.js",
        "src/ui/AiOrganizationProposalController.js",
        "src/ui/AiProjectProposalController.js",
        "src/ui/AiTaskQualityController.js"
    ];
    for (const path of files) {
        const source = await fs.readFile(path, "utf8");
        assert.match(source, /requireAiStructuredCollection/);
        assert.match(source, /assertAiStructuredResponseComplete/);
    }
});

test("prioridades rechaza proposals que no sea un array", async () => {
    const source = await fs.readFile("google-apps-script/AI.gs", "utf8");
    assert.match(source, /if\s*\(\s*!Array\.isArray\(parsed\.proposals\)\s*\)/);
    assert.doesNotMatch(source, /Array.isArray(parsed.proposals)[\s\S]{0,80}: []/);
});
