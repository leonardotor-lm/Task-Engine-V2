import test from "node:test";
import assert from "node:assert/strict";
import {
    createConservativeMigrationSyncBackup
} from "../src/core/SyncMigrationMerger.js";

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

function tag(id, name) {

    return {
        id,
        name,
        color: "#a855f7",
        order: 0,
        version: 1,
        createdAt: DATE,
        updatedAt: DATE
    };

}

test("une elementos distintos de dos copias anteriores a la base común", () => {

    const result =
        createConservativeMigrationSyncBackup({
            localBackup: backup({
                tags: [tag("local", "Local")]
            }),
            remoteBackup: backup({
                tags: [tag("remote", "Nube")]
            })
        });

    assert.deepEqual(result.conflicts, []);
    assert.deepEqual(
        result.backup.data.tags
            .map(item => item.id)
            .sort(),
        ["local", "remote"]
    );

});

test("conserva un elemento presente en una sola copia en la migración", () => {

    const result =
        createConservativeMigrationSyncBackup({
            localBackup: backup({
                tags: [tag("tag-1", "Conservar")]
            }),
            remoteBackup: backup()
        });

    assert.deepEqual(result.conflicts, []);
    assert.equal(
        result.backup.data.tags[0].name,
        "Conservar"
    );

});

test("no decide automáticamente si el mismo elemento tiene contenidos distintos", () => {

    const result =
        createConservativeMigrationSyncBackup({
            localBackup: backup({
                tags: [tag("tag-1", "Local")]
            }),
            remoteBackup: backup({
                tags: [tag("tag-1", "Nube")]
            })
        });

    assert.equal(result.backup, null);
    assert.deepEqual(
        result.conflicts,
        ["tags:tag-1"]
    );

});
