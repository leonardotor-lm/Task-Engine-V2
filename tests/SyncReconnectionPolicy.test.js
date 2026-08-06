import test from "node:test";
import assert from "node:assert/strict";

import {
    createSafeMergedSyncBackup
} from "../src/core/SyncBackupMerger.js";
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

test("la comparación no depende del orden de las entidades ni de las claves", () => {

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
        ],
        taskSortPreferences: {
            "view:today": "PRIORITY",
            "area:area-1": "DUE_DATE"
        }
    });

    const second = backup({
        tasks: [
            {
                version: 1,
                title: "Primera",
                id: "task-1"
            },
            {
                version: 1,
                title: "Segunda",
                id: "task-2"
            }
        ],
        taskSortPreferences: {
            "area:area-1": "DUE_DATE",
            "view:today": "PRIORITY"
        }
    });

    assert.equal(
        createComparableSyncFingerprint(first),
        createComparableSyncFingerprint(second)
    );

});

test("reconoce copias idénticas sin pedir elección", () => {

    const localBackup = backup({
        tasks: [{
            id: "task-1",
            title: "Preparar clase",
            version: 2
        }],
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

test("no confunde contenidos distintos con la misma identificación y versión", () => {

    const localBackup = backup({
        tasks: [{
            id: "task-1",
            title: "Título local",
            version: 2
        }]
    });
    const remoteBackup = backup({
        tasks: [{
            id: "task-1",
            title: "Título remoto",
            version: 2
        }]
    });

    assert.equal(
        getSyncReconnectionAction({
            localBackup,
            remoteBackup
        }),
        SyncReconnectionAction.CONFLICT
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

test("migra una copia remota antigua conservando datos opcionales locales", () => {

    const sharedTasks = [{
        id: "task-1",
        title: "Preparar clase",
        version: 4
    }];

    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup({
                tasks: sharedTasks,
                customFilters: [{
                    id: "filter-1",
                    name: "Urgentes",
                    query: "priority:high",
                    version: 1
                }],
                goals: [{
                    id: "goal-1",
                    title: "Planificar trimestre",
                    version: 1
                }],
                taskSortPreferences: {
                    "view:today": "PRIORITY"
                }
            }),
            remoteBackup: backup({
                tasks: sharedTasks
            })
        }),
        SyncReconnectionAction.PUSH
    );

});

test("descarga datos opcionales cuando sólo la copia remota los admite", () => {

    const sharedTasks = [{
        id: "task-1",
        title: "Preparar clase",
        version: 4
    }];

    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup({
                tasks: sharedTasks
            }),
            remoteBackup: backup({
                tasks: sharedTasks,
                customFilters: [{
                    id: "filter-1",
                    name: "Urgentes",
                    query: "priority:high",
                    version: 1
                }],
                taskSortPreferences: {
                    "view:today": "PRIORITY"
                }
            })
        }),
        SyncReconnectionAction.PULL
    );

});

test("fusiona extensiones opcionales presentes en lados distintos", () => {

    const sharedTasks = [{
        id: "task-1",
        title: "Preparar clase",
        version: 4
    }];
    const localBackup = backup({
        tasks: sharedTasks,
        customFilters: [{
            id: "filter-local",
            name: "Local",
            query: "priority:high",
            version: 1
        }],
        taskSortPreferences: {
            "view:today": "PRIORITY"
        }
    });
    const remoteBackup = backup({
        tasks: sharedTasks,
        goals: [{
            id: "goal-remote",
            title: "Remoto",
            version: 1
        }],
        taskSortPreferences: {
            "area:area-1": "DUE_DATE"
        }
    });

    assert.equal(
        getSyncReconnectionAction({
            localBackup,
            remoteBackup
        }),
        SyncReconnectionAction.MERGE
    );

    const merged = createSafeMergedSyncBackup({
        localBackup,
        remoteBackup
    });

    assert.deepEqual(
        merged.data.customFilters.map(
            filter => filter.id
        ),
        ["filter-local"]
    );
    assert.deepEqual(
        merged.data.goals.map(goal => goal.id),
        ["goal-remote"]
    );
    assert.deepEqual(
        merged.data.taskSortPreferences,
        {
            "area:area-1": "DUE_DATE",
            "view:today": "PRIORITY"
        }
    );

});

test("fusiona filtros distintos presentes en ambas copias", () => {

    const sharedTasks = [{
        id: "task-1",
        title: "Preparar clase",
        version: 4
    }];

    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup({
                tasks: sharedTasks,
                customFilters: [{
                    id: "filter-local",
                    name: "Local",
                    query: "priority:high",
                    version: 1
                }]
            }),
            remoteBackup: backup({
                tasks: sharedTasks,
                customFilters: [{
                    id: "filter-remote",
                    name: "Remoto",
                    query: "due:today",
                    version: 1
                }]
            })
        }),
        SyncReconnectionAction.MERGE
    );

});

test("mantiene el conflicto si la misma preferencia tiene valores distintos", () => {

    const sharedTasks = [{
        id: "task-1",
        title: "Preparar clase",
        version: 4
    }];

    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup({
                tasks: sharedTasks,
                taskSortPreferences: {
                    "view:today": "PRIORITY"
                }
            }),
            remoteBackup: backup({
                tasks: sharedTasks,
                taskSortPreferences: {
                    "view:today": "DUE_DATE"
                }
            })
        }),
        SyncReconnectionAction.CONFLICT
    );

});

test("mantiene el conflicto si el mismo filtro difiere entre copias", () => {

    const sharedTasks = [{
        id: "task-1",
        title: "Preparar clase",
        version: 4
    }];

    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup({
                tasks: sharedTasks,
                customFilters: [{
                    id: "filter-1",
                    name: "Urgentes",
                    query: "priority:high",
                    version: 2
                }]
            }),
            remoteBackup: backup({
                tasks: sharedTasks,
                customFilters: [{
                    id: "filter-1",
                    name: "Hoy",
                    query: "due:today",
                    version: 2
                }]
            })
        }),
        SyncReconnectionAction.CONFLICT
    );

});

test("mantiene el conflicto cuando ambas copias contienen diferencias centrales", () => {

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
