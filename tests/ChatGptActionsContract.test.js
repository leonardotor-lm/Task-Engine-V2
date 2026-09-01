import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const code = readFileSync(
    new URL(
        "../google-apps-script/Code.gs",
        import.meta.url
    ),
    "utf8"
);
const schema = readFileSync(
    new URL(
        "../integrations/chatgpt-actions/openapi.yaml",
        import.meta.url
    ),
    "utf8"
);

test("Apps Script expone sólo las seis acciones GPT previstas", () => {
    for (const action of [
        "gptGetContext",
        "gptSearchTasks",
        "gptGetTask",
        "gptCreateTask",
        "gptUpdateTask",
        "gptCompleteTask"
    ]) {
        assert.match(code, new RegExp(`action === "${action}"`));
    }

    assert.doesNotMatch(code, /gptDeleteTask/);
    assert.doesNotMatch(code, /gptOverwriteSnapshot/);
});

test("el esquema exige confirmación para todas las escrituras", () => {
    for (const path of [
        "/v1/tasks/create",
        "/v1/tasks/update",
        "/v1/tasks/complete"
    ]) {
        const start = schema.indexOf(`  ${path}:`);
        const next = schema.indexOf("\n  /v1/", start + 1);
        const section = schema.slice(
            start,
            next === -1 ? schema.length : next
        );

        assert.ok(start >= 0);
        assert.match(
            section,
            /x-openai-isConsequential: true/
        );
    }
});

test("el esquema usa Bearer y limita las búsquedas", () => {
    assert.match(schema, /scheme: bearer/);
    assert.match(schema, /maximum: 100/);
    assert.doesNotMatch(schema, /TASK_ENGINE_TOKEN/);
});
