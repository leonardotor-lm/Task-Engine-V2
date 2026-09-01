import test from "node:test";
import assert from "node:assert/strict";

import {
    handleRequest,
    parseAccounts
} from "../integrations/chatgpt-actions/worker.js";

const API_KEY = "a-secure-api-key-with-more-than-24-chars";

function environment() {
    return {
        TASK_ENGINE_ACCOUNTS: JSON.stringify([{
            id: "leo",
            apiKey: API_KEY,
            endpoint:
                "https://script.google.com/macros/s/example/exec",
            token: "task-engine-secret"
        }])
    };
}

function request(path, body = {}) {
    return new Request(
        `https://actions.example${path}`,
        {
            method: "POST",
            headers: {
                authorization: `Bearer ${API_KEY}`,
                "content-type": "application/json"
            },
            body: JSON.stringify(body)
        }
    );
}

test("enruta una consulta e inyecta el token fuera del modelo", async () => {
    let forwarded;
    const response = await handleRequest(
        request("/v1/tasks/search", {
            status: "PENDING"
        }),
        environment(),
        async (_url, options) => {
            forwarded = JSON.parse(options.body);
            return new Response(JSON.stringify({
                ok: true,
                total: 2,
                tasks: []
            }));
        }
    );

    assert.equal(response.status, 200);
    assert.equal(forwarded.action, "gptSearchTasks");
    assert.equal(forwarded.token, "task-engine-secret");
    assert.deepEqual(forwarded.input, {
        status: "PENDING"
    });
});

test("rechaza credenciales desconocidas sin llamar Apps Script", async () => {
    let called = false;
    const unauthorized = request("/v1/context");
    unauthorized.headers.set(
        "authorization",
        "Bearer credencial-invalida"
    );

    const response = await handleRequest(
        unauthorized,
        environment(),
        async () => {
            called = true;
        }
    );

    assert.equal(response.status, 401);
    assert.equal(called, false);
});

test("valida la configuración multicuenta", () => {
    const accounts = parseAccounts(
        environment().TASK_ENGINE_ACCOUNTS
    );

    assert.equal(accounts[0].id, "leo");
    assert.throws(() => parseAccounts(JSON.stringify([{
        id: "otro",
        apiKey: API_KEY,
        endpoint: "http://inseguro.example",
        token: "secret"
    }])));
});
