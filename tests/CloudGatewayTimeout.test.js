import test from "node:test";
import assert from "node:assert/strict";

import {
    CloudGateway,
    SyncInvalidResponseError,
    SyncTimeoutError
} from "../src/infrastructure/CloudGateway.js";

test("una respuesta ilegible tras escribir deja el resultado incierto", async () => {
    const gateway = new CloudGateway({
        fetchFn: async () => ({
            ok: true,
            json: async () => { throw new SyntaxError("HTML"); }
        }),
        lockManager: null
    });

    await assert.rejects(
        gateway.saveIncremental({
            url: "https://example.com/exec",
            token: "secret",
            baseRevision: 1,
            changes: []
        }),
        SyncInvalidResponseError
    );
});

test("el plazo también cubre la lectura del cuerpo de la respuesta", async () => {
    const gateway = new CloudGateway({
        fetchFn: async () => ({
            ok: true,
            json: () => new Promise(() => {})
        }),
        timeoutMs: 15
    });
    await assert.rejects(
        gateway.status({ url: "https://example.com/exec", token: "secret" }),
        SyncTimeoutError
    );
});

test("una respuesta HTML muestra estado y tipo sin exponer su contenido", async () => {
    const gateway = new CloudGateway({
        fetchFn: async () => ({
            ok: false,
            status: 503,
            headers: { get: () => "text/html; charset=UTF-8" },
            json: async () => { throw new SyntaxError("HTML privado"); }
        })
    });
    await assert.rejects(
        gateway.status({ url: "https://example.com/exec", token: "secret" }),
        error => error instanceof SyncInvalidResponseError &&
            error.httpStatus === 503 &&
            error.contentType === "text/html" &&
            !error.message.includes("privado")
    );
});

test("las lecturas toleran treinta segundos y las escrituras sesenta", () => {

    const gateway = new CloudGateway({
        fetchFn: async () => ({
            ok: true,
            json: async () => ({ ok: true })
        })
    });

    assert.equal(gateway.timeoutMs, 30000);
    assert.equal(gateway.writeTimeoutMs, 60000);

});

test("las escrituras usan su plazo ampliado", async () => {
    let capturedSignal;
    const gateway = new CloudGateway({
        fetchFn: async (_url, options) => {
            capturedSignal = options.signal;
            return {
                ok: true,
                json: async () => ({ ok: true, revision: 2 })
            };
        },
        timeoutMs: 5,
        writeTimeoutMs: 50
    });

    await gateway.saveIncremental({
        url: "https://example.com/exec",
        token: "secret",
        baseRevision: 1,
        changes: []
    });

    assert.equal(capturedSignal.aborted, false);
});

test("permite reducir el plazo en pruebas y operaciones específicas", () => {

    const gateway = new CloudGateway({
        fetchFn: async () => ({
            ok: true,
            json: async () => ({ ok: true })
        }),
        timeoutMs: 25
    });

    assert.equal(gateway.timeoutMs, 25);

});

test("consulta sólo el estado remoto cuando no necesita descargar datos", async () => {
    let requestBody;
    const gateway = new CloudGateway({
        fetchFn: async (_url, options) => {
            requestBody = JSON.parse(options.body);
            return {
                ok: true,
                json: async () => ({
                    ok: true,
                    revision: 7
                })
            };
        }
    });

    const response = await gateway.status({
        url: "https://example.com/exec?token=old",
        token: "secret"
    });

    assert.equal(requestBody.action, "status");
    assert.equal(requestBody.token, "secret");
    assert.equal(response.revision, 7);
});

test("serializa escrituras entre pestañas con Web Locks", async () => {
    const locks = [];
    const gateway = new CloudGateway({
        lockManager: {
            async request(name, options, operation) {
                locks.push({ name, options });
                return operation();
            }
        },
        fetchFn: async () => ({
            ok: true,
            json: async () => ({
                ok: true,
                revision: 2
            })
        })
    });

    await gateway.saveIncremental({
        url: "https://example.com/exec",
        token: "secret",
        baseRevision: 1,
        changes: []
    });

    assert.equal(locks.length, 1);
    assert.match(
        locks[0].name,
        /^task-engine-sync-write:/
    );
    assert.equal(locks[0].options.mode, "exclusive");
});
