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

    repository.upsert({
        key: "task:t1",
        kind: "task",
        entityId: "t1",
        pageId: "p1",
        payload: { id: "t1", title: "Uno" },
        attempts: 1
    });
    repository.upsert({
        key: "task:t1",
        kind: "task",
        entityId: "t1",
        pageId: "p1",
        payload: { id: "t1", title: "Dos" },
        attempts: 2
    });

    const [pending] = repository.list();

    assert.equal(repository.list().length, 1);
    assert.equal(pending.payload.title, "Dos");
    assert.equal(pending.attempts, 2);

    repository.remove("task:t1");
    assert.deepEqual(repository.list(), []);

});
