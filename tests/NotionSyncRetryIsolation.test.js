import test from "node:test";
import assert from "node:assert/strict";
import {
    NotionSyncRetryController
} from "../src/ui/NotionSyncRetryController.js";
import {
    NotionSyncRetryRepository
} from "../src/infrastructure/NotionSyncRetryRepository.js";

function createStorage() {
    const values = new Map();
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
}

test("reintenta únicamente la cola de la instalación activa", async () => {

    const repository = new NotionSyncRetryRepository(
        createStorage()
    );
    const firstUrl = "https://example.test/user-a/exec";
    const secondUrl = "https://example.test/user-b/exec";

    repository.upsert({
        key: "task:task-a",
        kind: "task",
        entityId: "task-a",
        pageId: "page-a",
        payload: { id: "task-a", title: "Usuario A" },
        attempts: 1,
        lastError: "sin red"
    }, firstUrl);

    repository.upsert({
        key: "task:task-b",
        kind: "task",
        entityId: "task-b",
        pageId: "page-b",
        payload: { id: "task-b", title: "Usuario B" },
        attempts: 1,
        lastError: "sin red"
    }, secondUrl);

    let activeUrl = secondUrl;
    const calls = [];
    const gateway = {
        async updateNotionTaskPage(args) {
            calls.push(args);
            return { ok: true };
        },
        async updateNotionGoalPage() {
            return { ok: true };
        }
    };
    const app = {
        syncEngine: { gateway },
        syncConfig: {
            isConfigured: () => true,
            get: () => ({
                url: activeUrl,
                token: "token-b"
            })
        }
    };
    const controller = new NotionSyncRetryController(
        app,
        {
            repository,
            windowRef: null,
            documentRef: null
        }
    );

    controller.start();
    await Promise.resolve();
    await controller.retryPending();

    assert.equal(calls.length, 1);
    assert.equal(calls[0].pageId, "page-b");
    assert.equal(calls[0].task.id, "task-b");
    assert.equal(repository.list(secondUrl).length, 0);
    assert.equal(repository.list(firstUrl).length, 1);

    activeUrl = firstUrl;
    await controller.retryPending();

    assert.equal(calls.length, 2);
    assert.equal(calls[1].pageId, "page-a");
    assert.equal(calls[1].task.id, "task-a");
    assert.equal(repository.list(firstUrl).length, 0);

});
