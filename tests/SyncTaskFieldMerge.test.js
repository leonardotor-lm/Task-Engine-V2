import test from "node:test";
import assert from "node:assert/strict";

import {
    createThreeWayMergedSyncBackup
} from "../src/core/SyncThreeWayMerger.js";
import { Task } from "../src/domain/Task.js";

const DATE = "2026-08-17T12:00:00.000Z";

function task(overrides = {}) {
    return new Task({
        id: "task-1",
        title: "Tarea",
        version: 1,
        createdAt: DATE,
        updatedAt: DATE,
        manualOrder: 0,
        ...overrides
    }).toJSON();
}

function backup(taskValue) {
    return {
        format: "task-engine-v2-backup",
        version: 1,
        data: {
            tasks: [taskValue],
            areas: [],
            contexts: [],
            tags: [],
            customFilters: [],
            goals: [],
            activityEvents: [],
            taskSortPreferences: {},
            taskFilterPreferences: {},
            displayPreferences: {}
        }
    };
}

test("fusiona un cambio de orden local con una edición remota independiente", () => {
    const result = createThreeWayMergedSyncBackup({
        baseBackup: backup(task()),
        localBackup: backup(task({
            manualOrder: -1,
            version: 2,
            updatedAt: "2026-08-17T12:01:00.000Z"
        })),
        remoteBackup: backup(task({
            title: "Tarea editada",
            version: 2,
            updatedAt: "2026-08-17T12:02:00.000Z"
        }))
    });

    assert.deepEqual(result.conflicts, []);
    assert.equal(
        result.backup.data.tasks[0].manualOrder,
        -1
    );
    assert.equal(
        result.backup.data.tasks[0].title,
        "Tarea editada"
    );
    assert.equal(
        result.backup.data.tasks[0].version,
        3
    );
});

test("mantiene conflicto si ambos dispositivos cambian el mismo campo de la tarea", () => {
    const result = createThreeWayMergedSyncBackup({
        baseBackup: backup(task()),
        localBackup: backup(task({
            title: "Título local",
            version: 2,
            updatedAt: "2026-08-17T12:01:00.000Z"
        })),
        remoteBackup: backup(task({
            title: "Título remoto",
            version: 2,
            updatedAt: "2026-08-17T12:02:00.000Z"
        }))
    });

    assert.equal(result.backup, null);
    assert.deepEqual(
        result.conflicts,
        ["tasks:task-1"]
    );
});

test("mantiene conflicto si ambos dispositivos ordenan la misma tarea de forma distinta", () => {
    const result = createThreeWayMergedSyncBackup({
        baseBackup: backup(task()),
        localBackup: backup(task({
            manualOrder: -1,
            version: 2,
            updatedAt: "2026-08-17T12:01:00.000Z"
        })),
        remoteBackup: backup(task({
            manualOrder: 4,
            version: 2,
            updatedAt: "2026-08-17T12:02:00.000Z"
        }))
    });

    assert.equal(result.backup, null);
    assert.deepEqual(
        result.conflicts,
        ["tasks:task-1"]
    );
});
