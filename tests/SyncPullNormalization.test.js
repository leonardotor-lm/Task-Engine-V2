import test from "node:test";
import assert from "node:assert/strict";

import { SyncEngine } from "../src/core/SyncEngine.js";
import {
    createSyncFingerprint
} from "../src/core/SyncFingerprint.js";

function remoteBackup() {
    return {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt: "2026-08-17T12:00:00.000Z",
        data: {
            tasks: [{
                id: "task-1",
                title: "Tarea",
                version: 1
            }],
            areas: [],
            contexts: [],
            tags: [],
            goals: []
        }
    };
}

test("recuperar desde la nube registra la huella del estado resultante de la importación", async () => {
    const rawRemote = remoteBackup();
    const importedBackup = {
        ...rawRemote,
        exportedAt: "2026-08-17T12:01:00.000Z",
        data: {
            ...rawRemote.data,
            tasks: [{
                ...rawRemote.data.tasks[0],
                version: 2,
                createdAt: "1970-01-01T00:00:00.000Z",
                updatedAt: "1970-01-01T00:00:00.000Z",
                manualOrder: 0
            }]
        }
    };
    let synchronizedFingerprint = null;
    let imported = false;

    const engine = new SyncEngine({
        backupService: {
            parseAndValidate(json) {
                return JSON.parse(json).data;
            },
            importBackup(json) {
                assert.deepEqual(
                    JSON.parse(json),
                    rawRemote
                );
                imported = true;
            },
            createBackup() {
                assert.equal(imported, true);
                return importedBackup;
            }
        },
        config: {
            isConfigured: () => true,
            get: () => ({
                url: "https://example.com/exec",
                token: "abc"
            }),
            setRevision() {},
            markSynchronized(fingerprint) {
                synchronizedFingerprint = fingerprint;
            }
        },
        gateway: {
            async load() {
                return {
                    revision: 7,
                    data: rawRemote
                };
            }
        }
    });

    await engine.pull();

    assert.equal(
        synchronizedFingerprint,
        createSyncFingerprint(importedBackup)
    );
    assert.notEqual(
        synchronizedFingerprint,
        createSyncFingerprint(rawRemote)
    );
});
