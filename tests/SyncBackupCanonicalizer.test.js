import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import {
    createComparableSyncFingerprint,
    getSyncReconnectionAction,
    SyncReconnectionAction
} from "../src/core/SyncReconnectionPolicy.js";

function backup(data) {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            ...data
        }
    };

}

function legacyTask(overrides = {}) {

    return {
        id: "task-1",
        title: "Preparar clase",
        status: "INBOX",
        version: 1,
        createdAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-01T10:00:00.000Z",
        ...overrides
    };

}

test("iguala una tarea antigua con su representación actual", () => {

    const oldBackup = backup({
        tasks: [legacyTask()]
    });
    const currentBackup = backup({
        tasks: [
            new Task(legacyTask()).toJSON()
        ],
        customFilters: [],
        goals: [],
        taskSortPreferences: {}
    });

    assert.equal(
        createComparableSyncFingerprint(
            oldBackup
        ),
        createComparableSyncFingerprint(
            currentBackup
        )
    );

    assert.equal(
        getSyncReconnectionAction({
            localBackup: currentBackup,
            remoteBackup: oldBackup
        }),
        SyncReconnectionAction.IDENTICAL
    );

});

test("normaliza de forma estable fechas ausentes", () => {

    const first = backup({
        tasks: [
            {
                id: "task-2",
                title: "Segunda",
                version: 1
            },
            {
                id: "task-1",
                title: "Primera",
                version: 1
            }
        ]
    });
    const second = backup({
        tasks: [
            {
                title: "Primera",
                version: 1,
                id: "task-1"
            },
            {
                version: 1,
                id: "task-2",
                title: "Segunda"
            }
        ]
    });

    assert.equal(
        createComparableSyncFingerprint(first),
        createComparableSyncFingerprint(second)
    );

});

test("sube extensiones locales cuando el núcleo antiguo es equivalente", () => {

    const oldBackup = backup({
        tasks: [legacyTask()]
    });
    const currentBackup = backup({
        tasks: [
            new Task(legacyTask()).toJSON()
        ],
        customFilters: [],
        goals: [],
        taskSortPreferences: {
            "view:today": "PRIORITY"
        }
    });

    assert.equal(
        getSyncReconnectionAction({
            localBackup: currentBackup,
            remoteBackup: oldBackup
        }),
        SyncReconnectionAction.PUSH
    );

});

test("mantiene el conflicto si cambió contenido real", () => {

    const localBackup = backup({
        tasks: [
            new Task(
                legacyTask({
                    title: "Título local"
                })
            ).toJSON()
        ]
    });
    const remoteBackup = backup({
        tasks: [
            legacyTask({
                title: "Título remoto"
            })
        ]
    });

    assert.equal(
        getSyncReconnectionAction({
            localBackup,
            remoteBackup
        }),
        SyncReconnectionAction.CONFLICT
    );

});
