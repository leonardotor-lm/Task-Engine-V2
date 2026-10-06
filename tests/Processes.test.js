import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { Process } from "../src/domain/Process.js";
import { ProcessEntry } from "../src/domain/ProcessEntry.js";
import { ProcessRepository, ProcessEntryRepository } from "../src/infrastructure/ProcessRepository.js";
import { ProcessService } from "../src/core/ProcessService.js";
import { BackupService } from "../src/core/BackupService.js";
import { createIncrementalChanges } from "../src/core/SyncChangeSet.js";
import { createSyncFingerprint } from "../src/core/SyncFingerprint.js";
import { createThreeWayMergedSyncBackup } from "../src/core/SyncThreeWayMerger.js";
import { CloudGateway } from "../src/infrastructure/CloudGateway.js";

function storage() {
    const items = new Map();
    return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) };
}
function setup() {
    const store = storage();
    const repository = new ProcessRepository(store);
    const entryRepository = new ProcessEntryRepository(store);
    const service = new ProcessService({ repository, entryRepository,
        goalService: { getGoalById: id => id === "goal-1" ? { id } : null },
        taskService: { getTaskById: id => id === "task-1" ? { id } : null } });
    return { store, repository, entryRepository, service };
}
const snapshot = data => ({ format: "task-engine-v2-backup", version: 1,
    data: { tasks: [], areas: [], contexts: [], tags: [], goals: [], ...data } });

test("los procesos admiten las tres mediciones y rechazan límites inválidos", () => {
    assert.equal(new Process({ title: "Estudiar" }).progressType, "NONE");
    assert.equal(new Process({ title: "Leer", progressType: "PERCENTAGE", currentValue: 42 }).targetValue, 100);
    assert.throws(() => new Process({ title: "Leer", progressType: "PERCENTAGE", currentValue: 101 }));
    assert.throws(() => new Process({ title: "Leer", progressType: "QUANTITY", targetValue: 0, unit: "páginas" }));
    assert.throws(() => new Process({ title: "Leer", progressType: "QUANTITY", targetValue: 100 }));
    assert.throws(() => new ProcessEntry({ processId: "p", progressType: "PERCENTAGE", value: 101 }));
});

test("asocia objetivos opcionales y tareas sin alterar su organización anterior", () => {
    const { service } = setup();
    const process = service.createProcess({ title: "Estudiar realismo mágico", objectiveId: "goal-1", taskIds: ["task-1"] });
    assert.equal(process.objectiveId, "goal-1");
    assert.deepEqual(process.taskIds, ["task-1"]);
    assert.throws(() => service.updateProcess(process.id, { objectiveId: "missing" }));
    assert.equal(service.repository.getById(process.id).objectiveId, "goal-1");
    service.updateProcess(process.id, { objectiveId: null });
    assert.equal(service.repository.getById(process.id).objectiveId, null);
});

test("registra valores absolutos, admite correcciones y conserva la cronología al recargar", () => {
    const { store, service } = setup();
    const process = service.createProcess({ title: "Leer", progressType: "QUANTITY", targetValue: 417, unit: "páginas" });
    service.recordProgress(process.id, { value: 176, note: "Capítulo 8", createdAt: "2026-10-06T12:00:00Z" });
    service.recordProgress(process.id, { value: 170, note: "Corregí la página", createdAt: "2026-10-06T13:00:00Z" });
    assert.equal(service.getAllProcesses()[0].currentValue, 170);
    assert.equal(service.getAllProcesses()[0].status, "ACTIVE");
    assert.throws(() => service.recordProgress(process.id, { value: 418 }));
    assert.throws(() => service.updateProcess(process.id, { targetValue: 169 }));
    assert.equal(new ProcessEntryRepository(store).getAll().length, 2);
    assert.equal(service.getEntries(process.id)[0].note, "Corregí la página");
});

test("pausar, completar, reactivar y archivar conservan los avances", () => {
    const { service } = setup();
    const process = service.createProcess({ title: "Estudiar" });
    service.recordProgress(process.id, { note: "Leí un artículo" });
    service.updateProcess(process.id, { status: "PAUSED" });
    assert.throws(() => service.recordProgress(process.id, { note: "Nueva sesión" }));
    service.updateProcess(process.id, { status: "COMPLETED" });
    assert.ok(service.repository.getById(process.id).completedAt);
    service.updateProcess(process.id, { status: "ACTIVE" });
    assert.equal(service.repository.getById(process.id).completedAt, null);
    service.updateProcess(process.id, { status: "ARCHIVED" });
    assert.equal(service.getEntries(process.id).length, 1);
});

test("un fallo de almacenamiento no deja un proceso actualizado sólo en memoria", () => {
    const { store, service } = setup();
    const process = service.createProcess({ title: "Título original" });
    store.setItem = () => { throw new Error("Sin espacio"); };
    assert.throws(() => service.updateProcess(process.id, { title: "Nuevo título" }), /Sin espacio/);
    assert.equal(service.repository.getById(process.id).title, "Título original");
});

test("cambiar la unidad no interpreta las páginas anteriores como capítulos", () => {
    const { service } = setup();
    const process = service.createProcess({ title: "Leer", progressType: "QUANTITY", targetValue: 417, unit: "páginas" });
    service.recordProgress(process.id, { value: 176 });
    service.updateProcess(process.id, { unit: "capítulos", targetValue: 20 });
    assert.equal(service.getAllProcesses()[0].currentValue, 0);
    assert.equal(service.getEntries(process.id)[0].unit, "páginas");
    service.recordProgress(process.id, { value: 8 });
    assert.equal(service.getAllProcesses()[0].currentValue, 8);
});

test("Apps Script conserva procesos y avances en filas y cambios incrementales", () => {
    const backend = vm.createContext({ console });
    vm.runInContext(readFileSync(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8"), backend);
    const process = new Process({ id: "p", title: "Leer", progressType: "QUANTITY", targetValue: 417, unit: "páginas" });
    const entry = new ProcessEntry({ id: "e", processId: "p", progressType: "QUANTITY", value: 176, unit: "páginas" });
    const source = snapshot({ processes: [process.toJSON()], processEntries: [entry.toJSON()] });
    const restored = backend.rowsToSnapshotData_(backend.snapshotToRows_(source, 3));
    assert.deepEqual(JSON.parse(JSON.stringify(restored)), source.data);
    const initial = snapshot({ processes: [], processEntries: [] });
    const changes = createIncrementalChanges(initial, source);
    assert.deepEqual(changes.map(change => change.collection), ["processes", "processEntries"]);
    backend.validateIncrementalChanges_(changes);
    backend.applyIncrementalChanges_(initial, changes);
    backend.validateSnapshot_(initial);
    assert.equal(initial.data.processEntries[0].value, 176);
    assert.notEqual(createSyncFingerprint(snapshot({})), createSyncFingerprint(source));
});

test("las copias antiguas no borran procesos y una copia inválida no se aplica", () => {
    const { store, repository, entryRepository, service } = setup();
    const empty = { getAll: () => [], replaceAll() {} };
    const backup = new BackupService({ taskRepository: empty, areaRepository: empty, contextRepository: empty, tagRepository: empty,
        goalRepository: empty, processRepository: repository, processEntryRepository: entryRepository, storage: store });
    const process = service.createProcess({ title: "Estudiar" });
    service.recordProgress(process.id, { note: "Una sesión" });
    backup.importBackup(JSON.stringify(snapshot({})));
    assert.equal(repository.getAll().length, 1);
    assert.equal(entryRepository.getAll().length, 1);
    assert.throws(() => backup.importBackup(JSON.stringify(snapshot({ processes: [], processEntries: entryRepository.getAll().map(entry => entry.toJSON()) }))));
    assert.equal(repository.getAll().length, 1);
});

test("avances de dos dispositivos se conservan al reconciliar", () => {
    const process = new Process({ id: "p", title: "Estudiar" }).toJSON();
    const base = snapshot({ processes: [process], processEntries: [] });
    const local = snapshot({ processes: [process], processEntries: [new ProcessEntry({ id: "a", processId: "p", note: "PC" }).toJSON()] });
    const remote = snapshot({ processes: [process], processEntries: [new ProcessEntry({ id: "b", processId: "p", note: "Celular" }).toJSON()] });
    const result = createThreeWayMergedSyncBackup({ baseBackup: base, localBackup: local, remoteBackup: remote });
    assert.equal(result.conflicts.length, 0);
    assert.equal(result.backup.data.processEntries.length, 2);
});

test("el gateway rechaza servidores antiguos antes de enviar procesos y verifica una sola vez el compatible", async () => {
    let supported = false;
    const actions = [];
    const gateway = new CloudGateway({ lockManager: null, fetchFn: async (_url, options) => {
        const action = JSON.parse(options.body).action;
        actions.push(action);
        return { ok: true, json: async () => ({ ok: true, revision: 4, supportsProcesses: supported }) };
    } });
    const data = snapshot({ processes: [new Process({ title: "Estudiar" }).toJSON()], processEntries: [] });
    const connection = { url: "https://example.com/exec", token: "test", baseRevision: 3 };
    await assert.rejects(gateway.save({ ...connection, data }), error => error.code === "PROCESSES_NOT_SUPPORTED");
    assert.deepEqual(actions, ["status"]);
    supported = true;
    await gateway.save({ ...connection, data });
    await gateway.saveIncremental({ ...connection, changes: [{ collection: "processEntries", id: "e", operation: "create" }] });
    assert.deepEqual(actions, ["status", "status", "save", "saveIncremental"]);
});

test("una subida completa de un cliente anterior conserva los procesos remotos", () => {
    let writtenRows;
    const backend = vm.createContext({ console,
        LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
        SpreadsheetApp: { flush() {} }
    });
    vm.runInContext(readFileSync(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8"), backend);
    const process = new Process({ id: "p", title: "Estudiar" }).toJSON();
    const entry = new ProcessEntry({ id: "e", processId: "p", note: "Lectura" }).toJSON();
    backend.getStorage_ = () => ({ dataSheet: { getLastRow: () => 2, getRange: () => ({ setValues: rows => { writtenRows = rows; } }) },
        metaSheet: { getRange: () => ({ setValues() {} }) } });
    backend.getRevision_ = () => 3;
    backend.readSnapshotDataAtRevision_ = () => snapshot({ processes: [process], processEntries: [entry] }).data;
    backend.saveSnapshot_(snapshot({}), 3);
    const restored = backend.rowsToSnapshotData_(writtenRows);
    assert.equal(restored.processes[0].id, "p");
    assert.equal(restored.processEntries[0].note, "Lectura");
});
