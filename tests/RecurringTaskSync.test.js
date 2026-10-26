import test from "node:test";
import assert from "node:assert/strict";
import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";
import { createThreeWayMergedSyncBackup } from "../src/core/SyncThreeWayMerger.js";
import { createSafeMergedSyncBackup } from "../src/core/SyncBackupMerger.js";
import { createConservativeMigrationSyncBackup } from "../src/core/SyncMigrationMerger.js";

function backup(tasks) {
    return {
        format: "task-engine-v2-backup", version: 1,
        data: { tasks, areas: [], contexts: [], tags: [] }
    };
}

function recurring(overrides = {}) {
    return new Task({
        id: "current", title: "Actual", status: "PENDING",
        recurrence: "DAILY", recurrenceId: "series-1", dueDate: "2026-01-01",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...overrides
    });
}

function completeOnDevice(base) {
    const repository = {
        tasks: base.data.tasks.map(task => new Task(task)),
        getAll() { return [...this.tasks]; },
        getById(id) { return this.tasks.find(task => task.id === id); },
        update(task) { this.tasks = this.tasks.map(item => item.id === task.id ? task : item); },
        add(data) { const task = new Task(data); this.tasks.push(task); return task; }
    };
    new TaskService(repository).toggleTask("current");
    return backup(repository.tasks.map(task => task.toJSON()));
}

test("dos dispositivos completando la misma instancia no sincronizan dos pendientes", () => {
    const baseBackup = backup([recurring().toJSON()]);
    const localBackup = completeOnDevice(baseBackup);
    const remoteBackup = completeOnDevice(baseBackup);
    const localBefore = structuredClone(localBackup);
    const remoteBefore = structuredClone(remoteBackup);
    const result = createThreeWayMergedSyncBackup({ baseBackup, localBackup, remoteBackup });
    assert.equal(result.backup, null);
    assert.ok(result.conflicts.includes("tasks:recurrence:series-1"));
    assert.deepEqual(localBackup, localBefore);
    assert.deepEqual(remoteBackup, remoteBefore);
});

test("sincronizar una finalización con un dispositivo sin cambios conserva una única sucesora", () => {
    const baseBackup = backup([recurring().toJSON()]);
    const localBackup = completeOnDevice(baseBackup);
    const result = createThreeWayMergedSyncBackup({
        baseBackup, localBackup, remoteBackup: baseBackup
    });
    assert.deepEqual(result.conflicts, []);
    assert.equal(result.backup.data.tasks.length, 2);
    assert.equal(result.backup.data.tasks.filter(task => task.status === "PENDING").length, 1);
    const repeated = createThreeWayMergedSyncBackup({
        baseBackup: result.backup, localBackup: result.backup, remoteBackup: result.backup
    });
    assert.deepEqual(repeated.conflicts, []);
    assert.deepEqual(repeated.backup.data.tasks, result.backup.data.tasks);
});

test("unir una nueva sucesora con la instancia aún pendiente exige resolver el conflicto", () => {
    const current = recurring().toJSON();
    const next = recurring({ id: "next", dueDate: "2026-01-02" }).toJSON();
    const result = createThreeWayMergedSyncBackup({
        baseBackup: backup([]), localBackup: backup([current]), remoteBackup: backup([next])
    });
    assert.equal(result.backup, null);
    assert.deepEqual(result.conflicts, ["tasks:recurrence:series-1"]);
    const migration = createConservativeMigrationSyncBackup({
        localBackup: backup([current]), remoteBackup: backup([next])
    });
    assert.equal(migration.backup, null);
    assert.deepEqual(migration.conflicts, ["tasks:recurrence:series-1"]);
});

test("la fusión segura tampoco acepta dos pendientes aunque ambos dispositivos coincidan", () => {
    const invalid = backup([
        recurring().toJSON(), recurring({ id: "next" }).toJSON()
    ]);
    assert.equal(createSafeMergedSyncBackup({ localBackup: invalid, remoteBackup: invalid }), null);
});

test("permite historial, papelera, archivadas y series independientes", () => {
    const valid = backup([
        recurring().toJSON(),
        recurring({ id: "history", status: "COMPLETED" }).toJSON(),
        recurring({ id: "archived", status: "ARCHIVED" }).toJSON(),
        recurring({ id: "deleted", status: "DELETED" }).toJSON(),
        recurring({ id: "other", recurrenceId: "series-2" }).toJSON()
    ]);
    assert.ok(createSafeMergedSyncBackup({ localBackup: valid, remoteBackup: valid }));
    assert.deepEqual(createThreeWayMergedSyncBackup({
        baseBackup: valid, localBackup: valid, remoteBackup: valid
    }).conflicts, []);
});
