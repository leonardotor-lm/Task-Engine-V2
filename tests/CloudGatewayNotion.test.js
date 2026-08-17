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

test("crea una nota de tarea mediante Apps Script sin exponer el token de Notion", async () => {

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
                    pageId: "page-1",
                    pageUrl:
                        "https://www.notion.so/page-1"
                })
            };
        }
    });

    const task = {
        id: "task-1",
        title: "Preparar clase",
        status: "PENDING",
        isProject: false,
        areaName: "Trabajo",
        contextNames: ["PC"],
        tagNames: ["Literatura"],
        completedAt: null
    };

    const result =
        await gateway.createNotionTaskPage({
            url: "https://script.google.com/macros/s/demo/exec?token=old&action=old",
            token: "task-engine-token",
            task
        });

    assert.equal(
        request.body.action,
        "createNotionTaskPage"
    );
    assert.equal(
        request.body.token,
        "task-engine-token"
    );
    assert.deepEqual(
        request.body.task,
        task
    );
    assert.equal(
        Object.hasOwn(
            request.body,
            "notionToken"
        ),
        false
    );
    assert.equal(
        request.url.includes("token="),
        false
    );
    assert.equal(result.pageId, "page-1");

});
