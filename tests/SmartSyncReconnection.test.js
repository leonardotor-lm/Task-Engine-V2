import test from "node:test";
import assert from "node:assert/strict";

import { SyncEngine } from "../src/core/SyncEngine.js";
import {
    SyncReconnectionAction
} from "../src/core/SyncReconnectionPolicy.js";
import {
    SmartSyncReconnectionController
} from "../src/ui/SmartSyncReconnectionController.js";

function backup({
    tasks = [],
    areas = [],
    contexts = [],
    tags = [],
    customFilters = [],
    goals = [],
    taskSortPreferences = {}
} = {}) {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data: {
            tasks,
            areas,
            contexts,
            tags,
            customFilters,
            goals,
            taskSortPreferences
        }
    };

}

function createEngine({
    localBackup,
    remoteBackup,
    remoteRevision = 4,
    savedRevision = 5
}) {

    let currentLocal =
        structuredClone(localBackup);
    const calls = [];

    const backupService = {
        createBackup() {
            return structuredClone(
                currentLocal
            );
        },
        parseAndValidate(json) {
            calls.push(["validate"]);
            return JSON.parse(json).data;
        },
        importBackup(json) {
            calls.push(["import"]);
            currentLocal = JSON.parse(json);
        }
    };

    const config = {
        isConfigured: () => true,
        get: () => ({
            url: "https://example.com/exec",
            token: "token"
        }),
        setRevision(revision) {
            calls.push(["revision", revision]);
        },
        markSynchronized(fingerprint) {
            calls.push([
                "fingerprint",
                fingerprint
            ]);
        }
    };

    const gateway = {
        async load() {
            calls.push(["load"]);
            return {
                revision: remoteRevision,
                data: structuredClone(
                    remoteBackup
                )
            };
        },
        async save(request) {
            calls.push([
                "save",
                request.baseRevision,
                request.data
            ]);
            return {
                revision: savedRevision
            };
        }
    };

    return {
        engine: new SyncEngine({
            backupService,
            config,
            gateway
        }),
        calls,
        getLocalBackup: () =>
            structuredClone(currentLocal)
    };

}

test("marca copias idénticas sin subir ni descargar", async () => {

    const shared = backup({
        tasks: [{
            id: "task-1",
            version: 2
        }]
    });
    const { engine, calls } = createEngine({
        localBackup: shared,
        remoteBackup: shared
    });

    const result =
        await engine
            .reconcileUnknownConnection();

    assert.equal(
        result.action,
        SyncReconnectionAction.IDENTICAL
    );
    assert.equal(
        calls.some(call =>
            call[0] === "save" ||
            call[0] === "import"
        ),
        false
    );
    assert.deepEqual(
        calls.filter(call =>
            call[0] === "revision"
        ),
        [["revision", 4]]
    );

});

test("sube la copia local cuando la nube no tiene datos", async () => {

    const localBackup = backup({
        tasks: [{
            id: "task-local",
            version: 1
        }]
    });
    const { engine, calls } = createEngine({
        localBackup,
        remoteBackup: null,
        remoteRevision: 3,
        savedRevision: 4
    });

    const result =
        await engine
            .reconcileUnknownConnection();

    assert.equal(
        result.action,
        SyncReconnectionAction.PUSH
    );
    assert.equal(result.revision, 4);

    const saveCall = calls.find(
        call => call[0] === "save"
    );

    assert.equal(saveCall[1], 3);
    assert.deepEqual(saveCall[2], localBackup);

});

test("descarga la nube cuando la copia local está vacía", async () => {

    const remoteBackup = backup({
        tasks: [{
            id: "task-remote",
            version: 1
        }]
    });
    const {
        engine,
        calls,
        getLocalBackup
    } = createEngine({
        localBackup: backup(),
        remoteBackup,
        remoteRevision: 8
    });

    const result =
        await engine
            .reconcileUnknownConnection();

    assert.equal(
        result.action,
        SyncReconnectionAction.PULL
    );
    assert.equal(
        calls.some(call =>
            call[0] === "import"
        ),
        true
    );
    assert.deepEqual(
        getLocalBackup(),
        remoteBackup
    );

});

test("no modifica datos cuando ambas copias difieren", async () => {

    const { engine, calls } = createEngine({
        localBackup: backup({
            tasks: [{
                id: "task-local",
                version: 1
            }]
        }),
        remoteBackup: backup({
            tasks: [{
                id: "task-remote",
                version: 1
            }]
        }),
        remoteRevision: 9
    });

    const result =
        await engine
            .reconcileUnknownConnection();

    assert.equal(
        result.action,
        SyncReconnectionAction.CONFLICT
    );
    assert.equal(result.revision, 9);
    assert.equal(
        calls.some(call =>
            [
                "save",
                "import",
                "revision",
                "fingerprint"
            ].includes(call[0])
        ),
        false
    );

});

test("el controlador usa reconciliación sólo sin estado conocido", async () => {

    let originalChecks = 0;
    let reconciliations = 0;
    let resets = 0;
    let knownState = false;

    const app = {
        syncConfig: {
            isConfigured: () => true,
            hasKnownSyncState: () =>
                knownState
        },
        syncEngine: {
            async reconcileUnknownConnection() {
                reconciliations += 1;
                return {
                    action:
                        SyncReconnectionAction.PULL,
                    revision: 6
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
        resetTransientState() {
            resets += 1;
        },
        async checkRemoteStatus() {
            originalChecks += 1;
        }
    };

    const controller =
        new SmartSyncReconnectionController(
            app
        );

    controller.start();
    await app.checkRemoteStatus();

    assert.equal(reconciliations, 1);
    assert.equal(originalChecks, 0);
    assert.equal(resets, 1);
    assert.equal(app.syncRemoteRevision, 6);

    knownState = true;
    await app.checkRemoteStatus();

    assert.equal(reconciliations, 1);
    assert.equal(originalChecks, 1);

});
