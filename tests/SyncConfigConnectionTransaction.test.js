import test from "node:test";
import assert from "node:assert/strict";

import {
    SYNC_ENDPOINT_KEY,
    SYNC_FINGERPRINT_KEY,
    SYNC_LAST_SUCCESS_KEY,
    SYNC_REVISION_KEY,
    SYNC_TOKEN_KEY,
    SYNC_URL_KEY,
    SyncConfig
} from "../src/infrastructure/SyncConfig.js";

class FaultyStorage {

    constructor(entries = {}) {
        this.data = new Map(
            Object.entries(entries)
        );
        this.failure = null;
    }

    failOnce(method, key) {
        this.failure = { method, key };
    }

    maybeFail(method, key) {

        if (
            this.failure?.method === method &&
            this.failure?.key === key
        ) {
            this.failure = null;
            throw new Error("storage failure");
        }

    }

    getItem(key) {
        return this.data.get(key) ?? null;
    }

    setItem(key, value) {
        this.maybeFail("setItem", key);
        this.data.set(key, String(value));
    }

    removeItem(key) {
        this.maybeFail("removeItem", key);
        this.data.delete(key);
    }

}

function originalState() {
    return {
        [SYNC_URL_KEY]: "https://old.example.com/exec",
        [SYNC_TOKEN_KEY]: "old-token",
        [SYNC_ENDPOINT_KEY]: "https://old.example.com/exec",
        [SYNC_REVISION_KEY]: "7",
        [SYNC_FINGERPRINT_KEY]: "old-fingerprint",
        [SYNC_LAST_SUCCESS_KEY]:
            "2026-08-24T12:00:00.000Z"
    };
}

function assertStorage(storage, expected) {

    for (const [key, value] of Object.entries(expected)) {
        assert.equal(storage.getItem(key), value);
    }

}

test("revierte toda la configuración si falla la limpieza al cambiar de endpoint", () => {

    const initial = originalState();
    const storage = new FaultyStorage(initial);
    const config = new SyncConfig(storage);

    storage.failOnce(
        "removeItem",
        SYNC_FINGERPRINT_KEY
    );

    assert.throws(
        () => config.save({
            url: "https://new.example.com/exec",
            token: "new-token"
        }),
        /storage failure/
    );

    assertStorage(storage, initial);

});

test("clear restaura URL y token si falla una eliminación intermedia", () => {

    const initial = originalState();
    const storage = new FaultyStorage(initial);
    const config = new SyncConfig(storage);

    storage.failOnce(
        "removeItem",
        SYNC_TOKEN_KEY
    );

    assert.throws(
        () => config.clear(),
        /storage failure/
    );

    assert.equal(
        storage.getItem(SYNC_URL_KEY),
        initial[SYNC_URL_KEY]
    );
    assert.equal(
        storage.getItem(SYNC_TOKEN_KEY),
        initial[SYNC_TOKEN_KEY]
    );

});

test("forgetEndpoint restaura conexión y estado de sync si falla a mitad", () => {

    const initial = originalState();
    const storage = new FaultyStorage(initial);
    const config = new SyncConfig(storage);

    storage.failOnce(
        "removeItem",
        SYNC_REVISION_KEY
    );

    assert.throws(
        () => config.forgetEndpoint(),
        /storage failure/
    );

    assertStorage(storage, initial);

});

test("clearSyncState restaura los tres metadatos si falla una eliminación", () => {

    const initial = originalState();
    const storage = new FaultyStorage(initial);
    const config = new SyncConfig(storage);

    storage.failOnce(
        "removeItem",
        SYNC_LAST_SUCCESS_KEY
    );

    assert.throws(
        () => config.clearSyncState(),
        /storage failure/
    );

    assert.equal(
        storage.getItem(SYNC_REVISION_KEY),
        initial[SYNC_REVISION_KEY]
    );
    assert.equal(
        storage.getItem(SYNC_FINGERPRINT_KEY),
        initial[SYNC_FINGERPRINT_KEY]
    );
    assert.equal(
        storage.getItem(SYNC_LAST_SUCCESS_KEY),
        initial[SYNC_LAST_SUCCESS_KEY]
    );

});

test("un cambio de endpoint exitoso actualiza conexión y limpia estado anterior", () => {

    const storage = new FaultyStorage(
        originalState()
    );
    const config = new SyncConfig(storage);

    config.save({
        url: "https://new.example.com/exec",
        token: "new-token"
    });

    assert.equal(
        config.get().url,
        "https://new.example.com/exec"
    );
    assert.equal(config.get().token, "new-token");
    assert.equal(
        config.getKnownEndpoint(),
        "https://new.example.com/exec"
    );
    assert.equal(config.getRevision(), 0);
    assert.equal(config.getFingerprint(), "");
    assert.equal(config.getLastSuccess(), "");

});
