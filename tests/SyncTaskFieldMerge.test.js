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

test("fusiona cambios independientes en campos de una misma tarea", () => {
    const result = createThreeWayMergedSyncBackup({
        baseBackup: backup(task()),
        localBackup: backup(task({
            contextId: "contexto-1",
            version: 2,
            updatedAt: "2026-08-17T12:01:00.000Z"
        })),
        remoteBackup: backup(task({
            dueDate: "2026-08-20",
            version: 2,
            updatedAt: "2026-08-17T12:02:00.000Z"
        }))
    });

    assert.deepEqual(result.conflicts, []);
    assert.equal(
        result.backup.data.tasks[0].contextId,
        "contexto-1"
    );
    assert.equal(
        result.backup.data.tasks[0].dueDate,
        "2026-08-20"
    );
    assert.equal(
        result.backup.data.tasks[0].version,
        3
    );
});

test("acepta la evolución de una tarea creada después de la base común", () => {
    const initialTask = task({
        id: "task-new",
        title: "Tarea nueva",
        version: 1
    });
    const evolvedTask = task({
        id: "task-new",
        title: "Tarea nueva editada",
        contextId: "contexto-1",
        version: 3,
        updatedAt: "2026-08-17T12:02:00.000Z"
    });
    const base = backup(task());
    const local = backup(task());
    const remote = backup(task());

    local.data.tasks.push(evolvedTask);
    remote.data.tasks.push(initialTask);

    const result = createThreeWayMergedSyncBackup({
        baseBackup: base,
        localBackup: local,
        remoteBackup: remote
    });

    assert.deepEqual(result.conflicts, []);
    assert.deepEqual(
        result.backup.data.tasks.find(
            item => item.id === "task-new"
        ),
        evolvedTask
    );
});

test("mantiene conflicto entre dos versiones evolucionadas sin base común", () => {
    const base = backup(task());
    const local = backup(task());
    const remote = backup(task());

    local.data.tasks.push(task({
        id: "task-new",
        title: "Versión local",
        version: 2,
        updatedAt: "2026-08-17T12:01:00.000Z"
    }));
    remote.data.tasks.push(task({
        id: "task-new",
        title: "Versión remota",
        version: 2,
        updatedAt: "2026-08-17T12:02:00.000Z"
    }));

    const result = createThreeWayMergedSyncBackup({
        baseBackup: base,
        localBackup: local,
        remoteBackup: remote
    });

    assert.equal(result.backup, null);
    assert.deepEqual(
        result.conflicts,
        ["tasks:task-new"]
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
