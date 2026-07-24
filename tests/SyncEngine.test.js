import test from "node:test";
import assert from "node:assert/strict";

import {
    SYNC_REVISION_KEY,
    SYNC_TOKEN_KEY,
    SYNC_URL_KEY,
    SyncConfig
} from "../src/infrastructure/SyncConfig.js";

import {
    CloudGateway,
    SyncConflictError
} from "../src/infrastructure/CloudGateway.js";

import { SyncEngine } from "../src/core/SyncEngine.js";

class MemoryStorage {

    constructor() {
        this.data = new Map();
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

function response(payload, ok = true) {

    return {
        ok,
        async json() {
            return payload;
        }
    };

}

function backup() {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt: "2026-07-24T10:00:00.000Z",
        data: {
            tasks: [{
                id: "task-1",
                version: 1
            }],
            areas: [],
            contexts: [],
            tags: []
        }
    };

}

test("guarda URL y token usando las claves acordadas", () => {

    const storage = new MemoryStorage();
    const config = new SyncConfig(storage);

    config.save({
        url: "https://script.google.com/macros/s/test/exec",
        token: "secreto"
    });

    assert.equal(
        storage.getItem(SYNC_URL_KEY),
        "https://script.google.com/macros/s/test/exec"
    );

    assert.equal(
        storage.getItem(SYNC_TOKEN_KEY),
        "secreto"
    );

    assert.equal(config.isConfigured(), true);

});

test("conserva la revisión si la conexión no cambia", () => {

    const storage = new MemoryStorage();
    const config = new SyncConfig(storage);

    config.save({
        url: "https://example.com/exec",
        token: "token"
    });

    config.setRevision(8);

    config.save({
        url: "https://example.com/exec",
        token: "token"
    });

    assert.equal(config.getRevision(), 8);

    config.save({
        url: "https://other.example.com/exec",
        token: "otro-token"
    });

    assert.equal(config.getRevision(), 0);

});

test("rechaza URL sin HTTPS y token vacío", () => {

    const config = new SyncConfig(
        new MemoryStorage()
    );

    assert.throws(
        () => config.save({
            url: "http://example.com",
            token: "token"
        }),
        /HTTPS/
    );

    assert.throws(
        () => config.save({
            url: "https://example.com",
            token: ""
        }),
        /token/
    );

});

test("detecta cambios pendientes y registra la última sincronización", () => {

    const storage = new MemoryStorage();
    const config = new SyncConfig(storage);

    config.save({
        url: "https://example.com/exec",
        token: "token"
    });

    assert.equal(
        config.hasPendingChanges("fingerprint-1"),
        true
    );

    config.markSynchronized(
        "fingerprint-1",
        "2026-07-24T15:00:00.000Z"
    );

    assert.equal(
        config.hasPendingChanges("fingerprint-1"),
        false
    );

    assert.equal(
        config.hasPendingChanges("fingerprint-2"),
        true
    );

    assert.equal(
        config.getLastSuccess(),
        "2026-07-24T15:00:00.000Z"
    );

});

test("cambiar la conexión limpia el estado sincronizado", () => {

    const config = new SyncConfig(
        new MemoryStorage()
    );

    config.save({
        url: "https://example.com/exec",
        token: "token"
    });

    config.setRevision(3);
    config.markSynchronized(
        "fingerprint",
        "2026-07-24T15:00:00.000Z"
    );

    config.save({
        url: "https://other.example.com/exec",
        token: "other-token"
    });

    assert.equal(config.getRevision(), 0);
    assert.equal(config.getFingerprint(), "");
    assert.equal(config.getLastSuccess(), "");

});

test("persiste y valida la revisión remota", () => {

    const storage = new MemoryStorage();
    const config = new SyncConfig(storage);

    config.setRevision(4);

    assert.equal(config.getRevision(), 4);
    assert.equal(
        storage.getItem(SYNC_REVISION_KEY),
        "4"
    );

    assert.throws(
        () => config.setRevision(-1),
        /revisión/
    );

});

test("invoca fetch con el contexto global del navegador", async () => {

    let receivedContext;

    const fetchFn = async function() {

        receivedContext = this;

        return response({
            ok: true,
            revision: 0,
            data: null
        });

    };

    const gateway = new CloudGateway({
        fetchFn
    });

    await gateway.load({
        url: "https://example.com/exec",
        token: "abc"
    });

    assert.equal(
        receivedContext,
        globalThis
    );

});

test("la descarga envía acción y token en la URL", async () => {

    let request;

    const gateway = new CloudGateway({
        fetchFn: async (url, options) => {

            request = { url, options };

            return response({
                ok: true,
                revision: 1,
                data: null
            });

        }
    });

    await gateway.load({
        url: "https://example.com/exec",
        token: "abc"
    });

    const url = new URL(request.url);

    assert.equal(
        url.searchParams.get("action"),
        "load"
    );

    assert.equal(
        url.searchParams.get("token"),
        "abc"
    );

    assert.equal(request.options.method, "GET");

});

test("la subida usa texto plano para evitar preflight de CORS", async () => {

    let request;

    const gateway = new CloudGateway({
        fetchFn: async (url, options) => {

            request = { url, options };

            return response({
                ok: true,
                revision: 2
            });

        }
    });

    await gateway.save({
        url: "https://example.com/exec",
        token: "abc",
        baseRevision: 1,
        data: backup()
    });

    assert.equal(
        request.options.headers["Content-Type"],
        "text/plain;charset=utf-8"
    );

    assert.deepEqual(
        JSON.parse(request.options.body),
        {
            action: "save",
            baseRevision: 1,
            data: backup()
        }
    );

});

test("convierte conflictos remotos en un error específico", async () => {

    const gateway = new CloudGateway({
        fetchFn: async () => response({
            ok: false,
            error: {
                code: "CONFLICT",
                message: "Hay cambios remotos.",
                remoteRevision: 5
            }
        })
    });

    await assert.rejects(
        gateway.save({
            url: "https://example.com/exec",
            token: "abc",
            baseRevision: 3,
            data: backup()
        }),
        error => {

            assert.ok(
                error instanceof SyncConflictError
            );

            assert.equal(
                error.remoteRevision,
                5
            );

            return true;

        }
    );

});

test("sube la copia local con la revisión conocida", async () => {

    const calls = [];

    const config = {
        isConfigured: () => true,
        get: () => ({
            url: "https://example.com/exec",
            token: "abc"
        }),
        getRevision: () => 3,
        setRevision: revision => {
            calls.push(["revision", revision]);
        },
        markSynchronized: fingerprint => {
            calls.push(["fingerprint", fingerprint]);
        }
    };

    const backupService = {
        createBackup: () => backup(),
        parseAndValidate: json =>
            JSON.parse(json).data
    };

    const gateway = {
        async save(data) {
            calls.push(["save", data]);
            return { revision: 4 };
        }
    };

    const engine = new SyncEngine({
        backupService,
        config,
        gateway
    });

    const result = await engine.push();

    assert.equal(
        calls[0][1].baseRevision,
        3
    );

    assert.deepEqual(
        calls[1],
        ["revision", 4]
    );

    assert.equal(result.summary.tasks, 1);

});

test("detecta una revisión remota sin importar datos", async () => {

    let imported = false;

    const engine = new SyncEngine({
        backupService: {
            importBackup() {
                imported = true;
            }
        },
        config: {
            isConfigured: () => true,
            get: () => ({
                url: "https://example.com/exec",
                token: "abc"
            }),
            getRevision: () => 3
        },
        gateway: {
            async load() {
                return {
                    revision: 5,
                    data: backup()
                };
            }
        }
    });

    const status =
        await engine.checkRemoteRevision();

    assert.deepEqual(status, {
        localRevision: 3,
        remoteRevision: 5,
        updateAvailable: true
    });

    assert.equal(imported, false);

});

test("no anuncia actualización si las revisiones coinciden", async () => {

    const engine = new SyncEngine({
        backupService: {},
        config: {
            isConfigured: () => true,
            get: () => ({
                url: "https://example.com/exec",
                token: "abc"
            }),
            getRevision: () => 5
        },
        gateway: {
            async load() {
                return {
                    revision: 5,
                    data: backup()
                };
            }
        }
    });

    const status =
        await engine.checkRemoteRevision();

    assert.equal(
        status.updateAvailable,
        false
    );

});

test("descarga, valida e importa antes de guardar la revisión", async () => {

    const calls = [];
    const remoteBackup = backup();

    const config = {
        isConfigured: () => true,
        get: () => ({
            url: "https://example.com/exec",
            token: "abc"
        }),
        setRevision: revision => {
            calls.push(["revision", revision]);
        },
        markSynchronized: fingerprint => {
            calls.push(["fingerprint", fingerprint]);
        }
    };

    const backupService = {
        parseAndValidate(json) {
            calls.push(["validate"]);
            return JSON.parse(json).data;
        },
        importBackup(json) {
            calls.push([
                "import",
                JSON.parse(json).format
            ]);
        }
    };

    const gateway = {
        async load() {
            return {
                revision: 7,
                data: remoteBackup
            };
        }
    };

    const engine = new SyncEngine({
        backupService,
        config,
        gateway
    });

    await engine.pull();

    assert.deepEqual(calls, [
        ["validate"],
        ["import", "task-engine-v2-backup"],
        ["revision", 7],
        ["fingerprint",
            JSON.stringify({
                tasks: [{
                    id: "task-1",
                    version: 1
                }],
                areas: [],
                contexts: [],
                tags: []
            })
        ]
    ]);

});

test("no descarga cuando la nube todavía está vacía", async () => {

    const engine = new SyncEngine({
        backupService: {},
        config: {
            isConfigured: () => true,
            get: () => ({
                url: "https://example.com/exec",
                token: "abc"
            })
        },
        gateway: {
            async load() {
                return {
                    revision: 0,
                    data: null
                };
            }
        }
    });

    await assert.rejects(
        engine.pull(),
        /no hay datos/
    );

});
