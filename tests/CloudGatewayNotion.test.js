import test from "node:test";
import assert from "node:assert/strict";
import { CloudGateway } from "../src/infrastructure/CloudGateway.js";

test("consulta el estado de Notion mediante el backend de Task Engine", async () => {

    let request = null;

    const gateway = new CloudGateway({
        fetchFn: async (url, options) => {
            request = {
                url,
                options,
                body: JSON.parse(options.body)
            };

            return {
                ok: true,
                json: async () => ({
                    ok: true,
                    configured: true,
                    connected: true,
                    dataSourceId: "data-source-1",
                    dataSourceName: "Notas de Task Engine"
                })
            };
        }
    });

    const result = await gateway.notionStatus({
        url: "https://script.google.com/macros/s/demo/exec?token=old&action=old",
        token: "task-engine-token",
        validateRemote: true
    });

    assert.equal(
        request.body.action,
        "notionStatus"
    );
    assert.equal(
        request.body.token,
        "task-engine-token"
    );
    assert.equal(
        request.body.validateRemote,
        true
    );
    assert.equal(
        request.url.includes("token="),
        false
    );
    assert.equal(
        request.url.includes("action="),
        false
    );
    assert.equal(
        Object.hasOwn(
            request.body,
            "notionToken"
        ),
        false
    );
    assert.equal(
        result.dataSourceName,
        "Notas de Task Engine"
    );

});
