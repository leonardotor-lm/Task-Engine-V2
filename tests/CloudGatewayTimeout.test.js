import test from "node:test";
import assert from "node:assert/strict";

import {
    CloudGateway
} from "../src/infrastructure/CloudGateway.js";

test("la sincronización tolera hasta treinta segundos de respuesta", () => {

    const gateway = new CloudGateway({
        fetchFn: async () => ({
            ok: true,
            json: async () => ({ ok: true })
        })
    });

    assert.equal(gateway.timeoutMs, 30000);

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
