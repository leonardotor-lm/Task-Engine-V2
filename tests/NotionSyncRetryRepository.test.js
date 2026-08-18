import test from "node:test";
import assert from "node:assert/strict";
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

test("persiste, reemplaza y elimina reintentos de Notion", () => {

    const repository =
        new NotionSyncRetryRepository(createStorage());
    const scope = "https://example.test/a/exec";

    repository.upsert({
        key: "task:t1",
        kind: "task",
        entityId: "t1",
        pageId: "p1",
        payload: { id: "t1", title: "Uno" },
        attempts: 1
    }, scope);
    repository.upsert({
        key: "task:t1",
        kind: "task",
        entityId: "t1",
        pageId: "p1",
        payload: { id: "t1", title: "Dos" },
        attempts: 2
    }, scope);

    const [pending] = repository.list(scope);

    assert.equal(repository.list(scope).length, 1);
    assert.equal(pending.payload.title, "Dos");
    assert.equal(pending.attempts, 2);

    repository.remove("task:t1", scope);
    assert.deepEqual(repository.list(scope), []);

});

test("mantiene separadas las colas de dos instalaciones", () => {

    const repository =
        new NotionSyncRetryRepository(createStorage());
    const firstScope = "https://example.test/user-a/exec";
    const secondScope = "https://example.test/user-b/exec";

    repository.upsert({
        key: "task:t1",
        kind: "task",
        entityId: "t1",
        pageId: "page-a",
        payload: { id: "t1", title: "Usuario A" },
        attempts: 1
    }, firstScope);

    repository.upsert({
        key: "task:t1",
        kind: "task",
        entityId: "t1",
        pageId: "page-b",
        payload: { id: "t1", title: "Usuario B" },
        attempts: 1
    }, secondScope);

    const firstPending = repository.list(firstScope);
    const secondPending = repository.list(secondScope);

    assert.equal(firstPending.length, 1);
    assert.equal(secondPending.length, 1);
    assert.equal(firstPending[0].pageId, "page-a");
    assert.equal(secondPending[0].pageId, "page-b");

    repository.remove("task:t1", firstScope);

    assert.deepEqual(repository.list(firstScope), []);
    assert.equal(repository.list(secondScope).length, 1);

});
