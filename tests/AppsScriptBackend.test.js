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

    const context = {
        console
    };

    vm.createContext(context);
    vm.runInContext(source, context);

    return context;

}

function snapshot(overrides = {}) {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt: "2026-07-24T10:00:00.000Z",
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            ...overrides
        }
    };

}

function entity(id, overrides = {}) {

    return {
        id,
        version: 1,
        updatedAt:
            "2026-07-24T10:00:00.000Z",
        status: overrides.status ?? "PENDING",
        ...overrides
    };

}

test("convierte cada entidad en una fila versionada", () => {

    const backend = loadBackend();

    const rows = backend.snapshotToRows_(
        snapshot({
            tasks: [
                entity("task-1", {
                    title: "Tarea",
                    tagIds: []
                })
            ],
            areas: [
                entity("area-1", {
                    name: "Área"
                })
            ]
        }),
        3
    );

    assert.equal(rows.length, 2);

    assert.deepEqual(
        Array.from(rows[0].slice(0, 5)),
        [
            3,
            "task",
            "task-1",
            1,
            "2026-07-24T10:00:00.000Z"
        ]
    );

    assert.equal(
        JSON.parse(rows[0][5]).title,
        "Tarea"
    );

});

test("rechaza copias con identificadores duplicados", () => {

    const backend = loadBackend();
    const duplicated = entity("area-1");

    assert.throws(
        () => backend.validateSnapshot_(
            snapshot({
                areas: [
                    duplicated,
                    duplicated
                ]
            })
        ),
        error => error.code === "DUPLICATE_ID"
    );

});

test("rechaza referencias a entidades inexistentes", () => {

    const backend = loadBackend();

    assert.throws(
        () => backend.validateSnapshot_(
            snapshot({
                tasks: [
                    entity("task-1", {
                        title: "Tarea",
                        areaId: "missing-area",
                        tagIds: []
                    })
                ]
            })
        ),
        error =>
            error.code === "INVALID_REFERENCE"
    );

});

test("acepta relaciones válidas entre todas las colecciones", () => {

    const backend = loadBackend();

    assert.doesNotThrow(
        () => backend.validateSnapshot_(
            snapshot({
                tasks: [
                    entity("task-1", {
                        title: "Tarea",
                        areaId: "area-1",
                        contextId: "context-1",
                        tagIds: ["tag-1"]
                    })
                ],
                areas: [
                    entity("area-1")
                ],
                contexts: [
                    entity("context-1")
                ],
                tags: [
                    entity("tag-1")
                ]
            })
        )
    );

});

test("rechaza ciclos en la jerarquía de tareas", () => {

    const backend = loadBackend();

    assert.throws(
        () => backend.validateSnapshot_(
            snapshot({
                tasks: [
                    entity("task-1", {
                        parentTaskId: "task-2",
                        tagIds: []
                    }),
                    entity("task-2", {
                        parentTaskId: "task-1",
                        tagIds: []
                    })
                ]
            })
        ),
        error =>
            error.code === "INVALID_TASK_TREE"
    );

});

test("rechaza entidades que exceden el límite de una celda", () => {

    const backend = loadBackend();

    assert.throws(
        () => backend.snapshotToRows_(
            snapshot({
                tasks: [
                    entity("task-1", {
                        title: "Tarea",
                        description: "x".repeat(
                            46000
                        ),
                        tagIds: []
                    })
                ]
            }),
            1
        ),
        error =>
            error.code === "ENTITY_TOO_LARGE"
    );

});
