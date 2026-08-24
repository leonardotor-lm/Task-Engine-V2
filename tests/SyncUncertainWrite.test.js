import test from "node:test";
import assert from "node:assert/strict";

import { SyncEngine } from "../src/core/SyncEngine.js";
import { SyncConflictError } from "../src/infrastructure/CloudGateway.js";

function createBackup(version = 1) {
    return {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt: "2026-08-24T12:00:00.000Z",
        data: {
            tasks: [{ id: "task-1", version }],
            areas: [],
            contexts: [],
            tags: [],
            goals: [],
            activityEvents: []
        }
    };
}

function createConfig(revision = 3) {
    let currentRevision = revision;
    const synchronized = [];

    return {
        isConfigured: () => true,
        get: () => ({
            url: "https://example.com/exec",
            token: "token"
        }),
        getRevision: () => currentRevision,
        setRevision(value) {
            currentRevision = value;
        },
        markSynchronized(fingerprint) {
            synchronized.push(fingerprint);
        },
        synchronized
    };
}

function createBackupService(localBackup) {
    return {
        createBackup: () => localBackup,
        parseAndValidate: json => JSON.parse(json).data
    };
}

test("adopta la revisión remota si un push incierto sí había quedado guardado", async () => {
    const localBackup = createBackup();
    const config = createConfig();
    let saveCalls = 0;
    let loadCalls = 0;
    const gateway = {
        async save() {
            saveCalls += 1;

            if (saveCalls === 1) {
                throw new Error("timeout");
            }

            throw new Error("no debería volver a guardar");
        },
        async load() {
            loadCalls += 1;
            return {
                revision: 4,
                data: localBackup
            };
        }
    };
    const engine = new SyncEngine({
        backupService: createBackupService(localBackup),
        config,
        gateway
    });

    await assert.rejects(
        engine.push(),
        /timeout/
    );

    const result = await engine.push();

    assert.equal(result.revision, 4);
    assert.equal(config.getRevision(), 4);
    assert.equal(saveCalls, 1);
    assert.equal(loadCalls, 1);
    assert.equal(config.synchronized.length, 1);
});

test("reintenta el push si la nube no avanzó después del resultado incierto", async () => {
    const localBackup = createBackup();
    const config = createConfig();
    const baseRevisions = [];
    let saveCalls = 0;
    const gateway = {
        async save(payload) {
            saveCalls += 1;
            baseRevisions.push(payload.baseRevision);

            if (saveCalls === 1) {
                throw new Error("corte de red");
            }

            return { revision: 4 };
        },
        async load() {
            return {
                revision: 3,
                data: createBackup(0)
            };
        }
    };
    const engine = new SyncEngine({
        backupService: createBackupService(localBackup),
        config,
        gateway
    });

    await assert.rejects(
        engine.push(),
        /corte de red/
    );

    const result = await engine.push();

    assert.equal(result.revision, 4);
    assert.equal(config.getRevision(), 4);
    assert.deepEqual(baseRevisions, [3, 3]);
});

test("no sobrescribe si la nube avanzó con contenido distinto después de un push incierto", async () => {
    const localBackup = createBackup(1);
    const config = createConfig();
    let saveCalls = 0;
    const gateway = {
        async save() {
            saveCalls += 1;
            throw new Error("timeout");
        },
        async load() {
            return {
                revision: 4,
                data: createBackup(2)
            };
        }
    };
    const engine = new SyncEngine({
        backupService: createBackupService(localBackup),
        config,
        gateway
    });

    await assert.rejects(
        engine.push(),
        /timeout/
    );

    await assert.rejects(
        engine.push(),
        error => {
            assert.ok(error instanceof SyncConflictError);
            assert.equal(error.remoteRevision, 4);
            return true;
        }
    );

    assert.equal(saveCalls, 1);
    assert.equal(config.getRevision(), 3);
});
