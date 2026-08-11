import test from "node:test";
import assert from "node:assert/strict";

import {
    isUntouchedDefaultSeedBackup
} from "../src/core/SyncSeedData.js";
import {
    getSyncReconnectionAction,
    SyncReconnectionAction
} from "../src/core/SyncReconnectionPolicy.js";
import { Priority } from "../src/domain/Priority.js";

function task({
    id,
    title,
    priority = Priority.NONE,
    version = 1,
    status = "INBOX"
}) {

    const createdAt =
        "2026-08-06T20:00:00.000Z";

    return {
        id,
        title,
        description: "",
        status,
        statusBeforeDelete: null,
        areaId: null,
        contextId: null,
        priority,
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
        version,
        createdAt,
        updatedAt: createdAt,
        completedAt: null,
        dueDate: null,
        dueTime: null,
        postponements: []
    };

}

function seedBackup(overrides = {}) {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data: {
            tasks: [
                task({
                    id: "seed-literatura",
                    title:
                        "Preparar clase de Literatura",
                    priority: Priority.HIGH
                }),
                task({
                    id: "seed-evaluaciones",
                    title: "Corregir evaluaciones"
                })
            ],
            areas: [],
            contexts: [],
            tags: [],
            customFilters: [],
            goals: [],
            taskSortPreferences: {},
            ...overrides
        }
    };

}

function remoteBackup() {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data: {
            tasks: [
                task({
                    id: "task-real",
                    title: "Limpieza diaria"
                })
            ],
            areas: [],
            contexts: [],
            tags: [],
            customFilters: [],
            goals: [],
            taskSortPreferences: {}
        }
    };

}

function automaticSeedActivity(tasks) {

    return tasks.map((seedTask, index) => ({
        id: `seed-activity-${index}`,
        type: "TASK_CREATED",
        taskId: seedTask.id,
        taskTitle: seedTask.title,
        taskCount: 1,
        details: "",
        createdAt:
            "2026-08-06T20:00:01.000Z",
        updatedAt:
            "2026-08-06T20:00:01.000Z",
        version: 1
    }));

}

test("reconoce las dos tareas iniciales intactas", () => {

    assert.equal(
        isUntouchedDefaultSeedBackup(
            seedBackup()
        ),
        true
    );

});

test("una instalación con sólo ejemplos descarga la nube", () => {

    assert.equal(
        getSyncReconnectionAction({
            localBackup: seedBackup(),
            remoteBackup: remoteBackup()
        }),
        SyncReconnectionAction.PULL
    );

});

test("reconoce ejemplos que ya registraron su actividad automática", () => {

    const backup = seedBackup();
    backup.data.activityEvents =
        automaticSeedActivity(
            backup.data.tasks
        );

    assert.equal(
        isUntouchedDefaultSeedBackup(backup),
        true
    );
    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup,
            remoteBackup: remoteBackup()
        }),
        SyncReconnectionAction.PULL
    );

});

test("no descarta ejemplos con actividad real", () => {

    const backup = seedBackup();
    backup.data.activityEvents =
        automaticSeedActivity(
            backup.data.tasks
        );
    backup.data.activityEvents[0].type =
        "TASK_UPDATED";

    assert.equal(
        isUntouchedDefaultSeedBackup(backup),
        false
    );

});

test("no descarta una tarea de ejemplo modificada", () => {

    const backup = seedBackup();
    backup.data.tasks[0].version = 2;
    backup.data.tasks[0].updatedAt =
        "2026-08-06T20:05:00.000Z";

    assert.equal(
        isUntouchedDefaultSeedBackup(backup),
        false
    );

});

test("no considera vacía una copia con otra tarea", () => {

    const backup = seedBackup();
    backup.data.tasks.push(
        task({
            id: "task-personal",
            title: "Tarea personal"
        })
    );

    assert.equal(
        isUntouchedDefaultSeedBackup(backup),
        false
    );

});

test("no considera vacía una copia con organización local", () => {

    const backup = seedBackup({
        areas: [{
            id: "area-1",
            name: "Personal",
            version: 1
        }]
    });

    assert.equal(
        isUntouchedDefaultSeedBackup(backup),
        false
    );

});

test("una nube con sólo ejemplos no se trata como vacía", () => {

    assert.notEqual(
        getSyncReconnectionAction({
            localBackup: remoteBackup(),
            remoteBackup: seedBackup()
        }),
        SyncReconnectionAction.PUSH
    );

});
