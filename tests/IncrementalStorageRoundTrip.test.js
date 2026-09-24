import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
    new URL("../google-apps-script/Code.gs", import.meta.url), "utf8"
);

function backendWithSheet() {
    const backend = { console };
    vm.createContext(backend);
    vm.runInContext(source, backend);
    const rows = [["revision", "type", "id", "version", "updatedAt", "payload"]];
    const sheet = {
        getLastRow: () => rows.length,
        getRange(row, column, height = 1, width = 1) {
            return {
                getValues: () => rows.slice(row - 1, row - 1 + height)
                    .map(value => value.slice(column - 1, column - 1 + width))
            };
        }
    };
    const append = values => rows.push(...values);
    const plain = value => JSON.parse(JSON.stringify(value));
    const base = {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt: "2026-09-24T00:00:00.000Z",
        data: {
            tasks: [],
            areas: [{ id: "a", name: "Original", version: 1 }],
            contexts: [], tags: [], goals: [],
            activityEvents: [],
            displayPreferences: { sidebarTitle: "Prueba" }
        }
    };
    append(backend.snapshotToRows_(base, 1));
    return { backend, rows, sheet, append, plain, base };
}

test("persiste sólo cambios y reconstruye altas, bajas, preferencias y checkpoint", () => {
    const { backend, rows, sheet, append, plain, base } = backendWithSheet();
    const changes = [
        { collection: "areas", id: "a", operation: "update",
            value: { id: "a", name: "Editada", version: 2 } },
        { collection: "areas", id: "b", operation: "create",
            value: { id: "b", name: "Nueva", version: 1 } },
        { collection: "displayPreferences", id: "preferences", operation: "update",
            value: { sidebarTitle: "Nuevo título" } }
    ];
    append(backend.incrementalChangesToRows_(changes, 2));
    assert.equal(rows.filter(row => row[0] === 2).length, 4);
    const data = plain(backend.readSnapshotDataAtRevision_(sheet, 2));
    assert.equal(data.areas[0].name, "Editada");
    assert.equal(data.areas[1].id, "b");
    assert.equal(data.displayPreferences.sidebarTitle, "Nuevo título");
    append(backend.incrementalChangesToRows_([
        { collection: "areas", id: "a", operation: "delete" }
    ], 3));
    assert.deepEqual(plain(backend.readSnapshotDataAtRevision_(sheet, 3)).areas,
        [{ id: "b", name: "Nueva", version: 1 }]);

    const retained = backend.getRecentRevisionRows_(sheet, 3, 2);
    assert.deepEqual(plain(backend.rowsToSnapshotData_(
        retained.filter(row => row[0] === 3)
    )).areas, [{ id: "b", name: "Nueva", version: 1 }]);
    assert.equal(base.data.areas[0].name, "Original");
});

test("ignora un lote incremental anterior que quedó sin confirmar", () => {
    const { backend, sheet, append } = backendWithSheet();
    append(backend.incrementalChangesToRows_([
        { collection: "areas", id: "a", operation: "delete" }
    ], 2));
    append(backend.incrementalChangesToRows_([
        { collection: "areas", id: "a", operation: "update",
            value: { id: "a", name: "Confirmada", version: 2 } }
    ], 2));
    assert.equal(backend.readSnapshotDataAtRevision_(sheet, 2)
        .areas[0].name, "Confirmada");
});

test("un checkpoint confirmado reemplaza un delta anterior sin confirmar", () => {
    const { backend, sheet, append, base } = backendWithSheet();
    append(backend.incrementalChangesToRows_([
        { collection: "areas", id: "a", operation: "delete" }
    ], 2));
    append([[2, "checkpointStart", "batch", 2, "", ""]]);
    append(backend.snapshotToRows_({ ...base, data: {
        ...base.data,
        areas: [{ id: "a", name: "Confirmada", version: 2 }]
    } }, 2));
    assert.equal(backend.readSnapshotDataAtRevision_(sheet, 2)
        .areas[0].name, "Confirmada");
});

test("rechaza cadenas de deltas sin checkpoint y revisiones interrumpidas", () => {
    const { backend, sheet, append } = backendWithSheet();
    append(backend.incrementalChangesToRows_([
        { collection: "areas", id: "a", operation: "delete" }
    ], 3));
    assert.throws(() => backend.readSnapshotDataAtRevision_(sheet, 3),
        /Falta una revisión/);
});

test("saveIncremental escribe lotes pequeños y una copia completa cada 16 revisiones", () => {
    const { backend, rows, sheet, base, plain } = backendWithSheet();
    const meta = [
        ["revision", "updatedAt", "formatVersion"],
        [1, base.exportedAt, 1]
    ];
    const range = (values, row, column, height = 1, width = 1) => ({
        getValue: () => values[row - 1][column - 1],
        getValues: () => values.slice(row - 1, row - 1 + height)
            .map(value => value.slice(column - 1, column - 1 + width)),
        setValues(data) {
            data.forEach((value, index) => {
                values[row - 1 + index] = [
                    ...(values[row - 1 + index] || [])
                ];
                value.forEach((entry, offset) => {
                    values[row - 1 + index][column - 1 + offset] = entry;
                });
            });
        }
    });
    sheet.getRange = (row, column, height, width) =>
        range(rows, row, column, height, width);
    const metaSheet = {
        getRange: (row, column, height, width) =>
            range(meta, row, column, height, width)
    };
    backend.getStorage_ = () => ({ dataSheet: sheet, metaSheet });
    backend.LockService = { getScriptLock: () => ({
        tryLock: () => true, releaseLock() {}
    }) };
    backend.SpreadsheetApp = { flush() {} };

    for (let revision = 2; revision <= 17; revision += 1) {
        const result = backend.saveIncremental_([{
            collection: "areas", id: "a", operation: "update",
            value: { id: "a", name: `Versión ${revision}`, version: revision }
        }], revision - 1);
        assert.equal(result.revision, revision);
        assert.equal(result.checkpoint, revision === 16);
        assert.equal(result.rowsWritten, revision === 16 ?
            backend.snapshotToRows_({ ...base, data: {
                ...base.data, areas: [{ id: "a", name: "Versión 16", version: 16 }]
            } }, revision).length + 1 : 2);
        assert.equal(backend.readSnapshotDataAtRevision_(sheet, revision)
            .areas[0].name, `Versión ${revision}`);
    }
    assert.equal(meta[1][0], 17);
    assert.equal(plain(backend.readSnapshotDataAtRevision_(sheet, 1))
        .areas[0].name, "Original");
});
