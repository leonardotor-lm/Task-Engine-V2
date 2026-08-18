import test from "node:test";
import assert from "node:assert/strict";
import {
    NotionSyncRetryController
} from "../src/ui/NotionSyncRetryController.js";

function createRepository() {
    const items = new Map();
    return {
        list: () => [...items.values()],
        upsert: item => items.set(item.key, item),
        remove: key => items.delete(key)
    };
}

test("guarda una actualización fallida y la elimina al reintentar", async () => {

    let shouldFail = true;
    const repository = createRepository();
    const gateway = {
        async updateNotionTaskPage() {
            if (shouldFail) {
                throw new Error("sin red");
            }
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
                url: "https://example.test/exec",
                token: "app-token"
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

    await assert.rejects(
        gateway.updateNotionTaskPage({
            url: "https://example.test/exec",
            token: "app-token",
            pageId: "page-1",
            task: {
                id: "task-1",
                title: "Pendiente"
            }
        }),
        /sin red/
    );

    assert.equal(repository.list().length, 1);
    assert.equal(app.notionSyncRetryState.pendingCount, 1);

    shouldFail = false;
    await controller.retryPending();

    assert.equal(repository.list().length, 0);
    assert.equal(app.notionSyncRetryState.pendingCount, 0);

});

test("la cola no persiste credenciales de conexión", async () => {

    const repository = createRepository();
    const gateway = {
        async updateNotionTaskPage() {
            throw new Error("fallo");
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
                url: "https://example.test/exec",
                token: "secreto"
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

    await assert.rejects(
        gateway.updateNotionTaskPage({
            url: "https://example.test/exec",
            token: "secreto",
            pageId: "page-1",
            task: { id: "task-1", title: "Uno" }
        })
    );

    const [pending] = repository.list();

    assert.equal(pending.url, undefined);
    assert.equal(pending.token, undefined);

});

test("un reintento exitoso limpia el error visible de la tarea", async () => {

    let shouldFail = true;
    let renderCount = 0;
    let clearCount = 0;
    const repository = createRepository();
    const gateway = {
        async updateNotionTaskPage() {
            if (shouldFail) {
                throw new Error("sin red");
            }
            return { ok: true };
        },
        async updateNotionGoalPage() {
            return { ok: true };
        }
    };
    const taskNotesController = {
        errorTaskId: "task-1",
        clearError() {
            clearCount += 1;
            this.errorTaskId = null;
        }
    };
    const app = {
        selectedTask: { id: "task-1" },
        render() {
            renderCount += 1;
        },
        syncEngine: { gateway },
        syncConfig: {
            isConfigured: () => true,
            get: () => ({
                url: "https://example.test/exec",
                token: "app-token"
            })
        }
    };
    const controller = new NotionSyncRetryController(
        app,
        {
            repository,
            windowRef: null,
            documentRef: null,
            taskNotesController
        }
    );

    controller.start();
    await Promise.resolve();

    await assert.rejects(
        gateway.updateNotionTaskPage({
            pageId: "page-1",
            task: { id: "task-1", title: "Uno" }
        })
    );

    shouldFail = false;
    await controller.retryPending();

    assert.equal(clearCount, 1);
    assert.equal(renderCount, 1);
    assert.equal(taskNotesController.errorTaskId, null);
    assert.equal(repository.list().length, 0);

});
