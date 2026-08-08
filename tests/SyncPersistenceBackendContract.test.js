import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
    new URL(
        "../google-apps-script/Code.gs",
        import.meta.url
    ),
    "utf8"
);

function loadBackend() {

    const context = { console };

    vm.createContext(context);
    vm.runInContext(source, context);

    return context;

}

function snapshot(optionalData = {}) {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt:
            "2026-08-08T20:00:00.000Z",
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            goals: [],
            ...optionalData
        }
    };

}

function plain(value) {

    return JSON.parse(JSON.stringify(value));

}

function hasOwn(object, property) {

    return Object.prototype.hasOwnProperty.call(
        object,
        property
    );

}

test("Apps Script conserva filtros guardados y preferencias en un round trip", () => {

    const backend = loadBackend();
    const sourceSnapshot = snapshot({
        customFilters: [
            {
                id: "filter-1",
                name: "Con subtareas",
                query: "tieneSubtareas:si",
                version: 3,
                createdAt:
                    "2026-08-08T18:00:00.000Z",
                updatedAt:
                    "2026-08-08T19:00:00.000Z"
            }
        ],
        taskSortPreferences: {
            "view:TODAY": "PRIORITY",
            "view:ALL": "CREATED_NEWEST"
        },
        taskFilterPreferences: {
            "view:TODAY": {
                areaId: "",
                contextId: "context-1",
                tagId: "",
                priority: "",
                due: ""
            }
        }
    });

    const rows = backend.snapshotToRows_(
        sourceSnapshot,
        7
    );

    const types = rows.map(row => row[1]);

    assert.ok(types.includes("customFilter"));
    assert.ok(types.includes("snapshotMeta"));
    assert.ok(types.includes(
        "taskSortPreferences"
    ));
    assert.ok(types.includes(
        "taskFilterPreferences"
    ));

    const restored = plain(
        backend.rowsToSnapshotData_(rows)
    );

    assert.deepEqual(
        restored.customFilters,
        sourceSnapshot.data.customFilters
    );
    assert.deepEqual(
        restored.taskSortPreferences,
        sourceSnapshot.data
            .taskSortPreferences
    );
    assert.deepEqual(
        restored.taskFilterPreferences,
        sourceSnapshot.data
            .taskFilterPreferences
    );

});

test("loadSnapshot reconstruye el mismo contrato persistido en la revisión activa", () => {

    const backend = loadBackend();
    const rows = backend.snapshotToRows_(
        snapshot({
            customFilters: [
                {
                    id: "filter-load",
                    name: "Prioridad alta",
                    query: "prioridad:alta",
                    version: 1,
                    createdAt:
                        "2026-08-08T18:00:00.000Z",
                    updatedAt:
                        "2026-08-08T18:00:00.000Z"
                }
            ],
            taskSortPreferences: {
                "view:TODAY": "DUE_DATE"
            },
            taskFilterPreferences: {}
        }),
        12
    );

    backend.getStorage_ = () => ({
        dataSheet: {
            getLastRow() {
                return rows.length + 1;
            },
            getRange() {
                return {
                    getValues() {
                        return rows;
                    }
                };
            }
        },
        metaSheet: {
            getRange(row, column) {
                return {
                    getValue() {
                        return column === 1
                            ? 12
                            : "";
                    },
                    getDisplayValue() {
                        return column === 2
                            ? "2026-08-08T20:00:00.000Z"
                            : "";
                    }
                };
            }
        }
    });

    const result = plain(
        backend.loadSnapshot_()
    );

    assert.equal(result.revision, 12);
    assert.equal(
        result.data.data.customFilters[0].id,
        "filter-load"
    );
    assert.equal(
        result.data.data
            .taskSortPreferences["view:TODAY"],
        "DUE_DATE"
    );
    assert.deepEqual(
        result.data.data.taskFilterPreferences,
        {}
    );

});

test("una revisión nueva conserva vacíos explícitos como borrados deliberados", () => {

    const backend = loadBackend();
    const rows = backend.snapshotToRows_(
        snapshot({
            customFilters: [],
            taskSortPreferences: {},
            taskFilterPreferences: {}
        }),
        8
    );

    const restored = plain(
        backend.rowsToSnapshotData_(rows)
    );

    assert.equal(
        hasOwn(restored, "customFilters"),
        true
    );
    assert.equal(
        hasOwn(
            restored,
            "taskSortPreferences"
        ),
        true
    );
    assert.equal(
        hasOwn(
            restored,
            "taskFilterPreferences"
        ),
        true
    );

    assert.deepEqual(restored.customFilters, []);
    assert.deepEqual(
        restored.taskSortPreferences,
        {}
    );
    assert.deepEqual(
        restored.taskFilterPreferences,
        {}
    );

});

test("una revisión histórica sin esquema omite datos opcionales en vez de borrarlos", () => {

    const backend = loadBackend();
    const rows = backend.snapshotToRows_(
        snapshot(),
        6
    );

    const restored = plain(
        backend.rowsToSnapshotData_(rows)
    );

    assert.equal(
        hasOwn(restored, "customFilters"),
        false
    );
    assert.equal(
        hasOwn(
            restored,
            "taskSortPreferences"
        ),
        false
    );
    assert.equal(
        hasOwn(
            restored,
            "taskFilterPreferences"
        ),
        false
    );

});

test("el contrato puede persistir filtros aunque un cliente anterior no envíe preferencias", () => {

    const backend = loadBackend();
    const rows = backend.snapshotToRows_(
        snapshot({
            customFilters: [
                {
                    id: "filter-legacy-client",
                    name: "Sin fecha",
                    query: "tieneFecha:no",
                    version: 1,
                    createdAt:
                        "2026-08-08T18:00:00.000Z",
                    updatedAt:
                        "2026-08-08T18:00:00.000Z"
                }
            ]
        }),
        9
    );

    const restored = plain(
        backend.rowsToSnapshotData_(rows)
    );

    assert.equal(
        restored.customFilters.length,
        1
    );
    assert.equal(
        restored.customFilters[0].id,
        "filter-legacy-client"
    );
    assert.equal(
        hasOwn(
            restored,
            "taskSortPreferences"
        ),
        false
    );
    assert.equal(
        hasOwn(
            restored,
            "taskFilterPreferences"
        ),
        false
    );

});

test("rechaza una revisión marcada como moderna si pierde su payload de preferencias", () => {

    const backend = loadBackend();
    const meta = JSON.stringify({
        schemaVersion: 2,
        optionalFields: {
            customFilters: false,
            taskSortPreferences: true,
            taskFilterPreferences: false
        }
    });

    assert.throws(
        () => backend.rowsToSnapshotData_([
            [
                10,
                "snapshotMeta",
                "sync-state",
                2,
                "",
                meta
            ]
        ]),
        error =>
            error.code ===
                "CORRUPT_REMOTE_DATA"
    );

});

test("valida los valores de orden antes de escribirlos en Sheets", () => {

    const backend = loadBackend();

    assert.throws(
        () => backend.snapshotToRows_(
            snapshot({
                customFilters: [],
                taskSortPreferences: {
                    "view:TODAY": "INVALID_SORT"
                }
            }),
            11
        ),
        error =>
            error.code === "INVALID_SNAPSHOT"
    );

});
