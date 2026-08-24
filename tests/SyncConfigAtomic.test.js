import test from "node:test";
import assert from "node:assert/strict";

import {
    SYNC_FINGERPRINT_KEY,
    SYNC_LAST_SUCCESS_KEY,
    SYNC_REVISION_KEY,
    SyncConfig
} from "../src/infrastructure/SyncConfig.js";

class FailingStorage {

    constructor(initial = {}) {
        this.data = new Map(
            Object.entries(initial)
        );
        this.failKey = null;
        this.failOnce = false;
    }

    getItem(key) {
        return this.data.get(key) ?? null;
    }

    setItem(key, value) {

        this.data.set(key, String(value));

        if (
            this.failKey === key &&
            this.failOnce
        ) {
            this.failOnce = false;
            throw new Error("storage failure");
        }

    }

    removeItem(key) {
        this.data.delete(key);
    }

    failNextWriteTo(key) {
        this.failKey = key;
        this.failOnce = true;
    }

}

function initialState() {
    return {
        [SYNC_REVISION_KEY]: "4",
        [SYNC_FINGERPRINT_KEY]: "old-fingerprint",
        [SYNC_LAST_SUCCESS_KEY]:
            "2026-08-23T12:00:00.000Z"
    };
}

function assertInitialState(storage) {
    assert.equal(
        storage.getItem(SYNC_REVISION_KEY),
        "4"
    );
    assert.equal(
        storage.getItem(SYNC_FINGERPRINT_KEY),
        "old-fingerprint"
    );
    assert.equal(
        storage.getItem(SYNC_LAST_SUCCESS_KEY),
        "2026-08-23T12:00:00.000Z"
    );
}

test("revierte revisión y huella si falla la escritura del fingerprint", () => {

    const storage = new FailingStorage(
        initialState()
    );
    const config = new SyncConfig(storage);

    config.setRevision(5);
    storage.failNextWriteTo(
        SYNC_FINGERPRINT_KEY
    );

    assert.throws(
        () => config.markSynchronized(
            "new-fingerprint",
            "2026-08-24T12:00:00.000Z"
        ),
        /storage failure/
    );

    assertInitialState(storage);

});

test("revierte los tres metadatos si falla lastSuccess", () => {

    const storage = new FailingStorage(
        initialState()
    );
    const config = new SyncConfig(storage);

    config.setRevision(5);
    storage.failNextWriteTo(
        SYNC_LAST_SUCCESS_KEY
    );

    assert.throws(
        () => config.markSynchronized(
            "new-fingerprint",
            "2026-08-24T12:00:00.000Z"
        ),
        /storage failure/
    );

    assertInitialState(storage);

});

test("confirma juntos revisión, huella y última sincronización", () => {

    const storage = new FailingStorage(
        initialState()
    );
    const config = new SyncConfig(storage);

    config.setRevision(5);
    config.markSynchronized(
        "new-fingerprint",
        "2026-08-24T12:00:00.000Z"
    );

    assert.equal(
        storage.getItem(SYNC_REVISION_KEY),
        "5"
    );
    assert.equal(
        storage.getItem(SYNC_FINGERPRINT_KEY),
        "new-fingerprint"
    );
    assert.equal(
        storage.getItem(SYNC_LAST_SUCCESS_KEY),
        "2026-08-24T12:00:00.000Z"
    );

});
