import test from "node:test";
import assert from "node:assert/strict";

import {
    SYNC_ENDPOINT_KEY,
    SYNC_FINGERPRINT_KEY,
    SYNC_REVISION_KEY,
    SYNC_TOKEN_KEY,
    SYNC_URL_KEY,
    SyncConfig
} from "../src/infrastructure/SyncConfig.js";

class MemoryStorage {

    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.get(key) ?? null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }

    removeItem(key) {
        this.values.delete(key);
    }

}

function synchronizedConfig() {

    const storage = new MemoryStorage();
    const config = new SyncConfig(storage);

    config.save({
        url: "https://example.com/exec",
        token: "token-1"
    });
    config.setRevision(7);
    config.markSynchronized(
        "fingerprint-1",
        "2026-08-06T12:00:00.000Z"
    );

    return { storage, config };

}

test("cambiar sólo el token conserva el estado sincronizado", () => {

    const { config } = synchronizedConfig();

    config.save({
        url: "https://example.com/exec",
        token: "token-2"
    });

    assert.equal(config.getRevision(), 7);
    assert.equal(
        config.getFingerprint(),
        "fingerprint-1"
    );

});

test("desconectar conserva la identidad y el estado del servicio", () => {

    const { storage, config } =
        synchronizedConfig();

    config.clear();

    assert.equal(
        storage.getItem(SYNC_URL_KEY),
        null
    );
    assert.equal(
        storage.getItem(SYNC_TOKEN_KEY),
        null
    );
    assert.equal(
        storage.getItem(SYNC_ENDPOINT_KEY),
        "https://example.com/exec"
    );
    assert.equal(
        storage.getItem(SYNC_REVISION_KEY),
        "7"
    );
    assert.equal(
        storage.getItem(SYNC_FINGERPRINT_KEY),
        "fingerprint-1"
    );

});

test("reconectar el mismo servicio recupera el estado anterior", () => {

    const { config } = synchronizedConfig();

    config.clear();
    config.save({
        url: "https://example.com/exec",
        token: "token-nuevo"
    });

    assert.equal(config.getRevision(), 7);
    assert.equal(
        config.getFingerprint(),
        "fingerprint-1"
    );
    assert.equal(
        config.hasKnownSyncState(),
        true
    );

});

test("conectar otro servicio limpia la revisión y la huella", () => {

    const { config } = synchronizedConfig();

    config.clear();
    config.save({
        url: "https://other.example.com/exec",
        token: "other-token"
    });

    assert.equal(config.getRevision(), 0);
    assert.equal(config.getFingerprint(), "");
    assert.equal(
        config.getKnownEndpoint(),
        "https://other.example.com/exec"
    );

});

test("olvidar el servicio elimina también su estado conocido", () => {

    const { storage, config } =
        synchronizedConfig();

    config.forgetEndpoint();

    assert.equal(
        storage.getItem(SYNC_ENDPOINT_KEY),
        null
    );
    assert.equal(config.getRevision(), 0);
    assert.equal(config.getFingerprint(), "");

});
