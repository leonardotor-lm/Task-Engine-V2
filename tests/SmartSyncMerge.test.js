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
    customFilters = [],
    goals = [],
    taskSortPreferences = {}
} = {}) {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data: {
            tasks: [{
                id: "task-1",
                title: "Preparar clase",
                description: "",
                status: "PENDING",
                statusBeforeDelete: null,
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
                version: 2,
                createdAt:
                    "2026-08-01T12:00:00.000Z",
                updatedAt:
                    "2026-08-01T12:00:00.000Z",
                completedAt: null,
                dueDate: null,
                dueTime: null,
                postponements: []
            }],
            areas: [],
            contexts: [],
            tags: [],
            customFilters,
            goals,
            taskSortPreferences
        }
    };

}

test("importa y sube la unión segura de datos opcionales", async () => {

    let currentLocal = backup({
        customFilters: [{
            id: "filter-local",
            name: "Urgentes",
            query: "priority:high",
            version: 1,
            createdAt:
                "2026-08-02T12:00:00.000Z",
            updatedAt:
                "2026-08-02T12:00:00.000Z"
        }],
        taskSortPreferences: {
            "view:today": "PRIORITY"
        }
    });
    const remoteBackup = backup({
        goals: [{
            id: "goal-remote",
            title: "Planificar trimestre",
            description: "",
            status: "ACTIVE",
            statusBeforeDelete: null,
            parentGoalId: null,
            dueDate: null,
            version: 1,
            createdAt:
                "2026-08-03T12:00:00.000Z",
            updatedAt:
                "2026-08-03T12:00:00.000Z",
            completedAt: null
        }],
        taskSortPreferences: {
            "area:area-1": "DUE_DATE"
        }
    });
    const calls = [];

    const backupService = {
        createBackup() {
            return structuredClone(currentLocal);
        },
        parseAndValidate(json) {
            return JSON.parse(json).data;
        },
        importBackup(json) {
            calls.push("import");
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
            calls.push(["fingerprint", fingerprint]);
        }
    };
    const gateway = {
        async load() {
            return {
                revision: 371,
                data: structuredClone(remoteBackup)
            };
        },
        async save(request) {
            calls.push([
                "save",
                request.baseRevision,
                request.data
            ]);
            return { revision: 372 };
        }
    };

    const engine = new SyncEngine({
        backupService,
        config,
        gateway
    });
    const result =
        await engine.reconcileUnknownConnection();

    assert.equal(
        result.action,
        SyncReconnectionAction.MERGE
    );
    assert.equal(result.revision, 372);
    assert.equal(calls.includes("import"), true);

    const saveCall = calls.find(
        call => Array.isArray(call) &&
            call[0] === "save"
    );

    assert.equal(saveCall[1], 371);
    assert.deepEqual(
        saveCall[2].data.customFilters.map(
            filter => filter.id
        ),
        ["filter-local"]
    );
    assert.deepEqual(
        saveCall[2].data.goals.map(goal => goal.id),
        ["goal-remote"]
    );
    assert.deepEqual(
        saveCall[2].data.taskSortPreferences,
        {
            "area:area-1": "DUE_DATE",
            "view:today": "PRIORITY"
        }
    );

});

test("el controlador reinicia la vista después de una fusión", async () => {

    let resets = 0;

    const app = {
        syncConfig: {
            isConfigured: () => true,
            hasKnownSyncState: () => false
        },
        syncEngine: {
            async reconcileUnknownConnection() {
                return {
                    action:
                        SyncReconnectionAction.MERGE,
                    revision: 372
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
        async checkRemoteStatus() {}
    };

    const controller =
        new SmartSyncReconnectionController(app);

    controller.start();
    await app.checkRemoteStatus();

    assert.equal(resets, 1);
    assert.equal(
        app.syncRemoteUpdateAvailable,
        false
    );
    assert.equal(app.syncRemoteRevision, 372);

});
