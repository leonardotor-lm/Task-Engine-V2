import test from "node:test";
import assert from "node:assert/strict";

import {
    createComparableSyncFingerprint,
    getSyncReconnectionAction,
    isSyncBackupEmpty,
    SyncReconnectionAction
} from "../src/core/SyncReconnectionPolicy.js";

function backup({
    tasks = [],
    areas = [],
    contexts = [],
    tags = [],
    customFilters,
    goals,
    taskSortPreferences
} = {}) {

    const data = {
        tasks,
        areas,
        contexts,
        tags
    };

    if (customFilters !== undefined) {
        data.customFilters = customFilters;
    }

    if (goals !== undefined) {
        data.goals = goals;
    }

    if (taskSortPreferences !== undefined) {
        data.taskSortPreferences =
            taskSortPreferences;
    }

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data
    };

}

test("considera vacías la ausencia remota y una copia sin entidades", () => {

    assert.equal(
        isSyncBackupEmpty(null),
        true
    );
    assert.equal(
        isSyncBackupEmpty(backup()),
        true
    );

});

test("normaliza campos opcionales al comparar copias antiguas", () => {

    const oldBackup = backup({
        tasks: [{ id: "task-1", version: 1 }]
    });
    const currentBackup = backup({
        tasks: [{ id: "task-1", version: 1 }],
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

});

test("reconoce copias idénticas sin pedir elección", () => {

    const localBackup = backup({
        tasks: [{ id: "task-1", version: 2 }],
        customFilters: [],
        goals: [],
        taskSortPreferences: {
            "view:today": "PRIORITY"
        }
    });

    assert.equal(
        getSyncReconnectionAction({
            localBackup,
            remoteBackup: structuredClone(
                localBackup
            )
        }),
        SyncReconnectionAction.IDENTICAL
    );

});

test("sube automáticamente cuando la nube está vacía", () => {

    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup({
                tasks: [{
                    id: "task-1",
                    version: 1
                }]
            }),
            remoteBackup: null
        }),
        SyncReconnectionAction.PUSH
    );

});

test("descarga automáticamente cuando la copia local está vacía", () => {

    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup(),
            remoteBackup: backup({
                tasks: [{
                    id: "task-1",
                    version: 1
                }]
            })
        }),
        SyncReconnectionAction.PULL
    );

});

test("mantiene el conflicto cuando ambas copias contienen diferencias", () => {

    assert.equal(
        getSyncReconnectionAction({
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
            })
        }),
        SyncReconnectionAction.CONFLICT
    );

});
