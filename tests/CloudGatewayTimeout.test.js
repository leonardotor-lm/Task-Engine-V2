import test from "node:test";
import assert from "node:assert/strict";

import {
    CloudGateway
} from "../src/infrastructure/CloudGateway.js";

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
