import test from "node:test";
import assert from "node:assert/strict";

import {
    SyncReconnectionAction
} from "../src/core/SyncReconnectionPolicy.js";
import {
    SmartSyncReconnectionController
} from "../src/ui/SmartSyncReconnectionController.js";

const createdAt = "2026-08-06T12:00:00.000Z";

function backup(title) {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data: {
            tasks: [{
                id: "task-1",
                title,
                description: "",
                status: "PENDING",
                areaId: null,
                contextId: null,
                priority: 0,
                tagIds: [],
                goalIds: [],
                attachments: [],
                isWaiting: false,
                parentTaskId: null,
                recurrenceId: null,
                recurrence: null,
                recurrenceInterval: 1,
                recurrenceWeekdays: [],
                manualOrder: 0,
                version: 1,
                createdAt,
                updatedAt: createdAt,
                completedAt: null,
                dueDate: null,
                dueTime: null,
                postponements: []
            }],
            areas: [],
            contexts: [],
            tags: [],
            customFilters: [],
            goals: [],
            taskSortPreferences: {}
        }
    };

}

test("muestra el detalle del conflicto dentro del panel", async () => {

    const localBackup = backup(
        '<script>alert("local")</script>'
    );
    const remoteBackup = backup(
        "Título remoto"
    );

    const sidebar = {
        render() {
            return `
                <section>
                    <p class="syncConflictHint">
                        Elegí qué versión querés conservar.
                    </p>
                </section>
            `;
        }
    };

    const app = {
        mainView: { sidebar },
        backupService: {
            createBackup: () =>
                structuredClone(localBackup)
        },
        syncConfig: {
            isConfigured: () => true,
            hasKnownSyncState: () => false,
            get: () => ({
                url: "https://example.com/exec",
                token: "token"
            })
        },
        syncEngine: {
            gateway: {
                async load() {
                    return {
                        revision: 371,
                        data:
                            structuredClone(
                                remoteBackup
                            )
                    };
                }
            },
            async reconcileUnknownConnection() {
                return {
                    action:
                        SyncReconnectionAction.CONFLICT,
                    revision: 371
                };
            }
        },
        syncCheckInProgress: false,
        autoSyncInProgress: false,
        syncLastError: null,
        syncRemoteRevision: null,
        syncRemoteUpdateAvailable: false,
        autoSyncBlockedFingerprint: null,
        render() {},
        resetTransientState() {},
        async checkRemoteStatus() {}
    };

    const controller =
        new SmartSyncReconnectionController(app);

    controller.start();
    await app.checkRemoteStatus();

    const html = sidebar.render();

    assert.match(
        html,
        /Diferencias detectadas/
    );
    assert.match(
        html,
        /Tareas con contenido distinto/
    );
    assert.doesNotMatch(
        html,
        /<script>alert/
    );
    assert.match(
        html,
        /&lt;script&gt;/
    );

});
