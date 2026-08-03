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

function loadBackend(overrides = {}) {

    const context = {
        console,
        ...overrides
    };

    vm.createContext(context);
    vm.runInContext(source, context);

    return context;

}

function attachmentMetadata(overrides = {}) {
    return {
        id: "attachment-1",
        driveFileId: "drive-file-1",
        name: "Documento.pdf",
        mimeType: "application/pdf",
        size: 1024,
        url: "https://drive.google.com/file/d/drive-file-1/view",
        createdAt: "2026-08-03T20:00:00.000Z",
        ...overrides
    };
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
            goals: [],
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

test("rechaza objetivos de tarea inexistentes", () => {

    const backend = loadBackend();

    assert.throws(
        () => backend.validateSnapshot_(
            snapshot({
                tasks: [
                    entity("task-1", {
                        title: "Tarea",
                        tagIds: [],
                        goalIds: [
                            "missing-goal"
                        ]
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
                ],
                goals: [
                    entity("goal-1", {
                        status: "ACTIVE"
                    }),
                    entity("goal-2", {
                        status: "ACTIVE",
                        parentGoalId: "goal-1"
                    })
                ]
            })
        )
    );

});

test("convierte objetivos en filas versionadas", () => {

    const backend = loadBackend();

    const rows = backend.snapshotToRows_(
        snapshot({
            goals: [
                entity("goal-1", {
                    title: "Objetivo",
                    status: "ACTIVE"
                })
            ]
        }),
        4
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0][1], "goal");
    assert.equal(rows[0][2], "goal-1");

});

test("rechaza ciclos en la jerarquía de objetivos", () => {

    const backend = loadBackend();

    assert.throws(
        () => backend.validateSnapshot_(
            snapshot({
                goals: [
                    entity("goal-1", {
                        status: "ACTIVE",
                        parentGoalId: "goal-2"
                    }),
                    entity("goal-2", {
                        status: "ACTIVE",
                        parentGoalId: "goal-1"
                    })
                ]
            })
        ),
        error =>
            error.code === "INVALID_GOAL_TREE"
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

test("valida metadatos de adjuntos sin exigirlos en copias anteriores", () => {
    const backend = loadBackend();

    assert.doesNotThrow(
        () => backend.validateSnapshot_(
            snapshot({
                tasks: [
                    entity("task-old", {
                        tagIds: []
                    }),
                    entity("task-new", {
                        tagIds: [],
                        attachments: [
                            attachmentMetadata()
                        ]
                    })
                ]
            })
        )
    );

    assert.throws(
        () => backend.validateSnapshot_(
            snapshot({
                tasks: [
                    entity("task-1", {
                        tagIds: [],
                        attachments: [
                            attachmentMetadata({
                                url: "https://example.com/file"
                            })
                        ]
                    })
                ]
            })
        ),
        error =>
            error.code ===
                "INVALID_ATTACHMENT"
    );
});

function driveFixture({
    parentFolderId = "attachments-folder"
} = {}) {
    const properties = new Map();
    const trashed = [];
    const file = {
        getId: () => "drive-file-1",
        getName: () => "Documento.pdf",
        getMimeType: () => "application/pdf",
        getSize: () => 3,
        getUrl: () => "https://drive.google.com/file/d/drive-file-1/view",
        setDescription: () => {},
        setTrashed: value => trashed.push(value),
        getParents: () => {
            let consumed = false;
            return {
                hasNext: () => !consumed,
                next: () => {
                    consumed = true;
                    return {
                        getId: () => parentFolderId
                    };
                }
            };
        }
    };
    const folder = {
        getId: () => "attachments-folder",
        isTrashed: () => false,
        createFile: () => file
    };

    return {
        trashed,
        context: {
            PropertiesService: {
                getScriptProperties: () => ({
                    getProperty: key =>
                        properties.get(key) ?? null,
                    setProperty: (key, value) =>
                        properties.set(key, value)
                })
            },
            DriveApp: {
                createFolder: () => folder,
                getFolderById: () => folder,
                getFileById: () => file
            },
            Utilities: {
                base64Decode: value =>
                    Array.from(
                        Buffer.from(value, "base64")
                    ),
                newBlob: (bytes, mimeType, name) => ({
                    bytes,
                    mimeType,
                    name
                }),
                getUuid: () => "attachment-1"
            }
        }
    };
}

test("sube un adjunto a la carpeta propia de Drive", () => {
    const fixture = driveFixture();
    const backend = loadBackend(
        fixture.context
    );
    const result = backend.uploadAttachment_({
        name: "Documento.pdf",
        mimeType: "application/pdf",
        base64Data: Buffer.from("pdf")
            .toString("base64")
    });

    assert.equal(result.ok, true);
    assert.equal(
        result.attachment.driveFileId,
        "drive-file-1"
    );
    assert.equal(
        result.attachment.size,
        3
    );
});

test("sólo envía a papelera archivos de la carpeta propia", () => {
    const fixture = driveFixture();
    const backend = loadBackend(
        fixture.context
    );

    backend.trashAttachment_(
        "drive-file-1"
    );

    assert.deepEqual(
        fixture.trashed,
        [true]
    );

    const foreignFixture = driveFixture({
        parentFolderId: "other-folder"
    });
    const foreignBackend = loadBackend(
        foreignFixture.context
    );

    assert.throws(
        () => foreignBackend.trashAttachment_(
            "drive-file-1"
        ),
        error =>
            error.code ===
                "ATTACHMENT_FORBIDDEN"
    );
    assert.deepEqual(
        foreignFixture.trashed,
        []
    );
});
