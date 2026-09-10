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

function pathSection(path) {
    const start = schema.indexOf(`  ${path}:`);
    const next = schema.indexOf("\n  /v1/", start + 1);

    assert.ok(start >= 0, `Falta ${path}`);

    return schema.slice(
        start,
        next === -1 ? schema.indexOf("\ncomponents:") : next
    );
}

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
        const section = pathSection(path);

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
    assert.match(
        schema,
        /https:\/\/task-engine-chatgpt-actions\.leonardotor\.workers\.dev/
    );
});

test("el esquema mantiene expuesta la consulta de contexto", () => {
    const section = pathSection("/v1/context");

    assert.match(section, /operationId: getTaskEngineContext/);
    assert.match(section, /required: \[scope\]/);
    assert.match(section, /enum: \[all\]/);
});

test("cada operación declara una respuesta JSON estructurada", () => {
    for (const path of [
        "/v1/context",
        "/v1/tasks/search",
        "/v1/tasks/get",
        "/v1/tasks/create",
        "/v1/tasks/update",
        "/v1/tasks/complete"
    ]) {
        const section = pathSection(path);

        assert.match(
            section,
            /responses:[\s\S]*content:\n^ {12}application\/json:\n^ {14}schema:/m
        );
        assert.doesNotMatch(
            section,
            /^ {12}application\/json:\n^ {12}schema:/m
        );
        assert.match(
            section,
            /default:\n {10}\$ref: "#\/components\/responses\/ErrorResponse"/
        );
    }
});

test("el contrato refleja estados y campos públicos reales", () => {
    assert.match(schema, /PublicTask:/);
    assert.match(schema, /postponementCount:/);
    assert.match(schema, /postponements:/);
    assert.match(
        schema,
        /enum: \[INBOX, PENDING, COMPLETED, ARCHIVED, TRASH\]/
    );
    assert.doesNotMatch(schema, /ARCHIVED, DELETED/);
});

test("obtener una tarea sólo solicita taskId", () => {
    const section = pathSection("/v1/tasks/get");
    const request = section.slice(
        section.indexOf("requestBody:"),
        section.indexOf("responses:")
    );

    assert.match(request, /required: \[taskId\]/);
    assert.doesNotMatch(request, /\n {16}(?:ok|total|tasks):/);
});
