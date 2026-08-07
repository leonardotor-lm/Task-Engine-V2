import test from "node:test";
import assert from "node:assert/strict";
import {
    createThreeWayMergedSyncBackup
} from "../src/core/SyncThreeWayMerger.js";

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

function filter(overrides = {}) {

    return {
        id: "filter-1",
        name: "Importantes",
        query: "priority:high",
        version: 1,
        createdAt: DATE,
        updatedAt: DATE,
        ...overrides
    };

}

test("fusiona cambios independientes sin perder filtros guardados", () => {

    const baseBackup = backup();
    const localBackup = backup({
        customFilters: [filter()]
    });
    const remoteBackup = backup({
        tags: [{
            id: "tag-1",
            name: "Remoto",
            color: "#a855f7",
            order: 0,
            version: 1,
            createdAt: DATE,
            updatedAt: DATE
        }]
    });

    const result =
        createThreeWayMergedSyncBackup({
            baseBackup,
            localBackup,
            remoteBackup
        });

    assert.deepEqual(result.conflicts, []);
    assert.equal(
        result.backup.data.customFilters.length,
        1
    );
    assert.equal(
        result.backup.data.customFilters[0].name,
        "Importantes"
    );
    assert.equal(
        result.backup.data.tags.length,
        1
    );
    assert.equal(
        result.backup.data.tags[0].name,
        "Remoto"
    );

});

test("fusiona preferencias de orden y filtros cambiadas en vistas distintas", () => {

    const baseBackup = backup({
        taskSortPreferences: {
            "view:today": "MANUAL"
        },
        taskFilterPreferences: {
            "view:today": {
                areaId: "",
                contextId: "",
                tagId: "",
                priority: "",
                due: ""
            }
        }
    });

    const localBackup = backup({
        taskSortPreferences: {
            "view:today": "PRIORITY"
        },
        taskFilterPreferences: {
            "view:today": {
                areaId: "",
                contextId: "",
                tagId: "",
                priority: "4",
                due: ""
            }
        }
    });

    const remoteBackup = backup({
        taskSortPreferences: {
            "view:today": "MANUAL",
            "view:inbox": "CREATED_NEWEST"
        },
        taskFilterPreferences: {
            "view:today": {
                areaId: "",
                contextId: "",
                tagId: "",
                priority: "",
                due: ""
            },
            "view:inbox": {
                areaId: "",
                contextId: "context-1",
                tagId: "",
                priority: "",
                due: ""
            }
        }
    });

    const result =
        createThreeWayMergedSyncBackup({
            baseBackup,
            localBackup,
            remoteBackup
        });

    assert.deepEqual(result.conflicts, []);
    assert.equal(
        result.backup.data
            .taskSortPreferences["view:today"],
        "PRIORITY"
    );
    assert.equal(
        result.backup.data
            .taskSortPreferences["view:inbox"],
        "CREATED_NEWEST"
    );
    assert.equal(
        result.backup.data
            .taskFilterPreferences["view:today"]
            .priority,
        "4"
    );
    assert.equal(
        result.backup.data
            .taskFilterPreferences["view:inbox"]
            .contextId,
        "context-1"
    );

});

test("mantiene conflicto sólo cuando ambos lados cambian el mismo dato de forma distinta", () => {

    const baseFilter = filter();
    const baseBackup = backup({
        customFilters: [baseFilter]
    });
    const localBackup = backup({
        customFilters: [filter({
            name: "Local",
            version: 2
        })]
    });
    const remoteBackup = backup({
        customFilters: [filter({
            name: "Nube",
            version: 2
        })]
    });

    const result =
        createThreeWayMergedSyncBackup({
            baseBackup,
            localBackup,
            remoteBackup
        });

    assert.equal(result.backup, null);
    assert.deepEqual(
        result.conflicts,
        ["customFilters:filter-1"]
    );

});

test("propaga eliminaciones cuando el otro lado no modificó la entidad", () => {

    const baseBackup = backup({
        customFilters: [filter()]
    });
    const localBackup = backup({
        customFilters: []
    });
    const remoteBackup = backup({
        customFilters: [filter()]
    });

    const result =
        createThreeWayMergedSyncBackup({
            baseBackup,
            localBackup,
            remoteBackup
        });

    assert.deepEqual(result.conflicts, []);
    assert.deepEqual(
        result.backup.data.customFilters,
        []
    );

});
