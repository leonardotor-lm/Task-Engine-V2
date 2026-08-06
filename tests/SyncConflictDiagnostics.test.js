import test from "node:test";
import assert from "node:assert/strict";

import {
    createSyncConflictDiagnostics
} from "../src/core/SyncConflictDiagnostics.js";

const createdAt = "2026-08-06T12:00:00.000Z";

function task(overrides = {}) {

    return {
        id: "task-1",
        title: "Preparar clase",
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
        postponements: [],
        ...overrides
    };

}

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
            ...data
        }
    };

}

test("describe entidades distintas y exclusivas de cada copia", () => {

    const details = createSyncConflictDiagnostics({
        localBackup: backup({
            tasks: [task({
                title: "Título local"
            })],
            customFilters: [{
                id: "filter-local",
                name: "Sólo local",
                query: "priority:high",
                version: 1,
                createdAt,
                updatedAt: createdAt
            }],
            taskSortPreferences: {
                "view:today": "PRIORITY"
            }
        }),
        remoteBackup: backup({
            tasks: [task({
                title: "Título remoto"
            })],
            goals: [{
                id: "goal-remote",
                title: "Sólo nube",
                description: "",
                status: "ACTIVE",
                statusBeforeDelete: null,
                parentGoalId: null,
                dueDate: null,
                version: 1,
                createdAt,
                updatedAt: createdAt,
                completedAt: null
            }],
            taskSortPreferences: {
                "view:today": "DUE_DATE"
            }
        })
    });

    assert.equal(
        details.some(detail =>
            detail.includes(
                "Tareas con contenido distinto"
            )
        ),
        true
    );
    assert.equal(
        details.some(detail =>
            detail.includes(
                "Filtros sólo en este dispositivo"
            )
        ),
        true
    );
    assert.equal(
        details.some(detail =>
            detail.includes(
                "Objetivos sólo en la nube"
            )
        ),
        true
    );
    assert.equal(
        details.some(detail =>
            detail.includes("Órdenes distintos")
        ),
        true
    );

});

test("informa equivalencia cuando no encuentra diferencias", () => {

    const shared = backup({
        tasks: [task()]
    });

    assert.deepEqual(
        createSyncConflictDiagnostics({
            localBackup: shared,
            remoteBackup:
                structuredClone(shared)
        }),
        [
            "Las copias se normalizan como equivalentes; el conflicto proviene del estado de sincronización."
        ]
    );

});
