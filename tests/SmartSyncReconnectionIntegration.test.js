import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    SYNC_ENDPOINT_KEY,
    SYNC_FINGERPRINT_KEY,
    SYNC_LAST_SUCCESS_KEY,
    SYNC_REVISION_KEY,
    SYNC_TOKEN_KEY,
    SYNC_URL_KEY,
    SyncConfig
} from "../src/infrastructure/SyncConfig.js";

const mainSource = await readFile(
    new URL("../src/main.js", import.meta.url),
    "utf8"
);

class MemoryStorage {

    constructor(entries = {}) {
        this.data = new Map(Object.entries(entries));
    }

    getItem(key) {
        return this.data.get(key) ?? null;
    }

    setItem(key, value) {
        this.data.set(key, String(value));
    }

    removeItem(key) {
        this.data.delete(key);
    }

}

test("la aplicación inicia la reconciliación inteligente después de preparar los datos opcionales", () => {

    assert.match(
        mainSource,
        /SmartSyncReconnectionController/
    );
    assert.match(
        mainSource,
        /syncOptionalDataBridge\.start\(\);[\s\S]*?smartSyncReconnectionController\.start\(\);[\s\S]*?app\.start\(\);/
    );

});

test("desconectar conserva el estado y ofrece una eliminación explícita del vínculo", () => {

    const storage = new MemoryStorage({
        [SYNC_URL_KEY]: "https://example.com/exec",
        [SYNC_TOKEN_KEY]: "token",
        [SYNC_ENDPOINT_KEY]: "https://example.com/exec",
        [SYNC_REVISION_KEY]: "4",
        [SYNC_FINGERPRINT_KEY]: "fingerprint",
        [SYNC_LAST_SUCCESS_KEY]:
            "2026-08-24T12:00:00.000Z"
    });
    const config = new SyncConfig(storage);

    config.clear();

    assert.equal(storage.getItem(SYNC_URL_KEY), null);
    assert.equal(storage.getItem(SYNC_TOKEN_KEY), null);
    assert.equal(
        storage.getItem(SYNC_ENDPOINT_KEY),
        "https://example.com/exec"
    );
    assert.equal(storage.getItem(SYNC_REVISION_KEY), "4");
    assert.equal(
        storage.getItem(SYNC_FINGERPRINT_KEY),
        "fingerprint"
    );
    assert.equal(
        storage.getItem(SYNC_LAST_SUCCESS_KEY),
        "2026-08-24T12:00:00.000Z"
    );

    config.forgetEndpoint();

    for (const key of [
        SYNC_URL_KEY,
        SYNC_TOKEN_KEY,
        SYNC_ENDPOINT_KEY,
        SYNC_REVISION_KEY,
        SYNC_FINGERPRINT_KEY,
        SYNC_LAST_SUCCESS_KEY
    ]) {
        assert.equal(storage.getItem(key), null);
    }

});
