import test from "node:test";
import assert from "node:assert/strict";

import {
    OngoingSyncReconciliationController
} from "../src/ui/OngoingSyncReconciliationController.js";

function backup() {
    return {
        format: "task-engine-v2-backup",
        version: 1,
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            customFilters: [],
            goals: [],
            activityEvents: []
        }
    };
}

test("una recuperación exitosa limpia el diagnóstico sin reconstruir la base", async () => {
    const current = backup();
    const app = {
        syncConflictDetails: [
            "Cambio incompatible: tasks:task-1"
        ],
        autoSyncBlockedFingerprint: "old",
        checkRemoteStatus: async () => null,
        backupService: {
            createBackup() {
                return current;
            }
        },
        syncConfig: {
            isConfigured: () => true,
            get: () => ({
                url: "https://sync.test"
            })
        },
        syncEngine: {
            async pull() {
                return { revision: 4 };
            }
        }
    };
    const repository = {
        set() {
            throw new Error(
                "El controlador no debe reconstruir la base confirmada"
            );
        },
        get() {
            return null;
        }
    };
    const controller =
        new OngoingSyncReconciliationController(
            app,
            { repository }
        );

    controller.start();
    await app.syncEngine.pull();

    assert.deepEqual(app.syncConflictDetails, []);
    assert.equal(
        app.autoSyncBlockedFingerprint,
        null
    );
});
