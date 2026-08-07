import test from "node:test";
import assert from "node:assert/strict";
import {
    SyncBaseSnapshotRepository
} from "../src/infrastructure/SyncBaseSnapshotRepository.js";

function createStorage() {

    const values = new Map();

    return {
        getItem(key) {
            return values.get(key) ?? null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        }
    };

}

function backup(id) {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data: {
            tasks: [{ id }]
        }
    };

}

test("guarda la base común sólo para el endpoint al que pertenece", () => {

    const repository =
        new SyncBaseSnapshotRepository(
            createStorage()
        );

    repository.set(
        backup("task-1"),
        "https://sync-a.test"
    );

    assert.equal(
        repository.get("https://sync-a.test")
            .data.tasks[0].id,
        "task-1"
    );
    assert.equal(
        repository.get("https://sync-b.test"),
        null
    );

});

test("puede limpiar la base común", () => {

    const repository =
        new SyncBaseSnapshotRepository(
            createStorage()
        );

    repository.set(
        backup("task-1"),
        "https://sync.test"
    );
    repository.clear();

    assert.equal(
        repository.get("https://sync.test"),
        null
    );

});
