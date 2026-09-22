import test from "node:test";
import assert from "node:assert/strict";

import { SyncEngine } from "../src/core/SyncEngine.js";
import {
    SyncConflictError,
    SyncProtocolError,
    SyncInvalidResponseError
} from "../src/infrastructure/CloudGateway.js";

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

test("verifica inmediatamente si un push incierto sí había quedado guardado", async () => {
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
            if (loadCalls === 1) {
                return {
                    revision: 3,
                    data: createBackup(0)
                };
            }
            return {
                revision: 4,
                data: localBackup
            };
        }
    };
    const engine = new SyncEngine({
        backupService: createBackupService(localBackup),
        config,
        gateway,
        uncertainWriteRetryDelays: [1],
        waitFn: async () => {}
    });

    const result = await engine.push();

    assert.equal(result.revision, 4);
    assert.equal(config.getRevision(), 4);
    assert.equal(saveCalls, 1);
    assert.equal(loadCalls, 2);
    assert.equal(config.synchronized.length, 1);
    assert.equal(result.writeOutcomeVerified, true);
});

test("comprueba en la nube una escritura con respuesta ilegible", async () => {
    const localBackup = createBackup();
    const config = createConfig();
    let saveCalls = 0;
    const engine = new SyncEngine({
        backupService: createBackupService(localBackup),
        config,
        gateway: {
            async save() {
                saveCalls += 1;
                throw new SyncInvalidResponseError();
            },
            async load() {
                return { revision: 4, data: localBackup };
            }
        },
        uncertainWriteRetryDelays: [],
        waitFn: async () => {}
    });

    const result = await engine.push();

    assert.equal(result.writeOutcomeVerified, true);
    assert.equal(saveCalls, 1);
    assert.equal(config.getRevision(), 4);
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
        gateway,
        uncertainWriteRetryDelays: [],
        waitFn: async () => {}
    });

    await assert.rejects(engine.push(), /corte de red/);

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
        gateway,
        uncertainWriteRetryDelays: [],
        waitFn: async () => {}
    });

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

test("verifica una escritura incierta con estado liviano antes de descargar", async () => {
    const localBackup = createBackup();
    const config = createConfig();
    let statusCalls = 0;
    let loadCalls = 0;
    const engine = new SyncEngine({
        backupService: createBackupService(localBackup),
        config,
        gateway: {
            async save() {
                throw new Error("timeout");
            },
            async status() {
                statusCalls += 1;
                return { revision: 4 };
            },
            async load() {
                loadCalls += 1;
                return {
                    revision: 4,
                    data: localBackup
                };
            }
        },
        uncertainWriteRetryDelays: [],
        waitFn: async () => {}
    });

    const result = await engine.push();

    assert.equal(result.writeOutcomeVerified, true);
    assert.equal(statusCalls, 1);
    assert.equal(loadCalls, 1);
});

test("reintenta SERVER_BUSY sin tratarlo como escritura incierta", async () => {
    const config = createConfig();
    const delays = [];
    let calls = 0;
    const engine = new SyncEngine({
        backupService: createBackupService(createBackup()),
        config,
        gateway: {
            async save() {
                calls += 1;
                if (calls < 3) {
                    throw new SyncProtocolError(
                        "Servidor ocupado",
                        "SERVER_BUSY"
                    );
                }
                return { revision: 4 };
            }
        },
        serverBusyRetryDelays: [5, 15],
        waitFn: async delay => delays.push(delay)
    });

    const result = await engine.saveRemote({});

    assert.equal(result.revision, 4);
    assert.equal(calls, 3);
    assert.deepEqual(delays, [5, 15]);
    assert.equal(engine.remoteWriteOutcomeUncertain, false);
});
