import test from "node:test";
import assert from "node:assert/strict";
import {
    OngoingSyncReconciliationController
} from "../src/ui/OngoingSyncReconciliationController.js";
import {
    createSyncFingerprint
} from "../src/core/SyncFingerprint.js";

const DATE = "2026-08-07T12:00:00.000Z";

function backup(data = {}) {

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
            taskSortPreferences: {},
            taskFilterPreferences: {},
            ...data
        }
    };

}

function filter(overrides = {}) {

    return {
        id: "filter-1",
        name: "Importantes",
        query: "priority:high",
        version: 1,
        createdAt: DATE,
        updatedAt: DATE,
        ...overrides
    };

}

function createHarness({
    baseBackup,
    localBackup,
    remoteBackup
}) {

    let currentBackup =
        structuredClone(localBackup);
    let savedRemote = null;
    let rememberedBase =
        structuredClone(baseBackup);
    let revision = 1;
    let fingerprint =
        createSyncFingerprint(baseBackup);

    const repository = {
        get(endpoint) {
            return endpoint === "https://sync.test"
                ? structuredClone(rememberedBase)
                : null;
        },
        set(value) {
            rememberedBase = structuredClone(value);
        }
    };

    const app = {
        autoSyncInProgress: false,
        syncCheckInProgress: false,
        syncRemoteUpdateAvailable: true,
        syncRemoteRevision: 2,
        autoSyncBlockedFingerprint: null,
        syncConflictDetails: [],
        syncLastError: null,
        render() {},
        getCurrentSyncFingerprint() {
            return createSyncFingerprint(
                currentBackup
            );
        },
        backupService: {
            createBackup() {
                return structuredClone(
                    currentBackup
                );
            },
            parseAndValidate(json) {
                return JSON.parse(json).data;
            },
            importBackup(json) {
                currentBackup = JSON.parse(json);
            }
        },
        syncConfig: {
            isConfigured() {
                return true;
            },
            hasKnownSyncState() {
                return true;
            },
            hasPendingChanges(value) {
                return value !== fingerprint;
            },
            get() {
                return {
                    url: "https://sync.test",
                    token: "token"
                };
            },
            getFingerprint() {
                return fingerprint;
            },
            setRevision(value) {
                revision = value;
            },
            markSynchronized(value) {
                fingerprint = value;
            }
        },
        syncEngine: {
            validateRevision(value) {
                return value;
            },
            gateway: {
                async load() {
                    return {
                        revision: 2,
                        data: structuredClone(
                            remoteBackup
                        )
                    };
                },
                async save(payload) {
                    savedRemote =
                        structuredClone(payload.data);
                    return { revision: 3 };
                }
            }
        }
    };

    return {
        app,
        repository,
        getCurrentBackup: () =>
            structuredClone(currentBackup),
        getSavedRemote: () =>
            structuredClone(savedRemote),
        getRevision: () => revision,
        getRememberedBase: () =>
            structuredClone(rememberedBase)
    };

}

test("fusiona automáticamente cambios independientes de local y nube", async () => {

    const baseBackup = backup();
    const localBackup = backup({
        customFilters: [filter()]
    });
    const remoteBackup = backup({
        tags: [{
            id: "tag-1",
            name: "Remoto",
            color: "#a855f7",
            order: 0,
            version: 1,
            createdAt: DATE,
            updatedAt: DATE
        }]
    });
    const harness = createHarness({
        baseBackup,
        localBackup,
        remoteBackup
    });
    const controller =
        new OngoingSyncReconciliationController(
            harness.app,
            { repository: harness.repository }
        );

    const result =
        await controller.reconcileKnownChanges();
    const current = harness.getCurrentBackup();

    assert.equal(result.action, "MERGE");
    assert.equal(result.revision, 3);
    assert.equal(
        current.data.customFilters.length,
        1
    );
    assert.equal(current.data.tags.length, 1);
    assert.equal(
        harness.getSavedRemote()
            .data.customFilters.length,
        1
    );
    assert.equal(harness.getRevision(), 3);
    assert.equal(
        harness.app.syncRemoteUpdateAvailable,
        false
    );
    assert.equal(harness.app.syncLastError, null);

});

test("un conflicto real no obliga a descargar ni sobrescribe ninguna copia", async () => {

    const baseBackup = backup({
        customFilters: [filter()]
    });
    const localBackup = backup({
        customFilters: [filter({
            name: "Local",
            version: 2
        })]
    });
    const remoteBackup = backup({
        customFilters: [filter({
            name: "Nube",
            version: 2
        })]
    });
    const harness = createHarness({
        baseBackup,
        localBackup,
        remoteBackup
    });
    const controller =
        new OngoingSyncReconciliationController(
            harness.app,
            { repository: harness.repository }
        );

    const result =
        await controller.reconcileKnownChanges();

    assert.equal(result.action, "CONFLICT");
    assert.equal(harness.getSavedRemote(), null);
    assert.equal(
        harness.getCurrentBackup()
            .data.customFilters[0].name,
        "Local"
    );
    assert.equal(
        harness.app.syncRemoteUpdateAvailable,
        true
    );
    assert.equal(harness.app.syncLastError, null);
    assert.match(
        harness.app.syncConflictDetails[0],
        /customFilters:filter-1/
    );

});
