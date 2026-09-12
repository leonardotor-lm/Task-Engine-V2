import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import {
    createIncrementalChanges
} from "../src/core/SyncChangeSet.js";
import {
    PendingSyncChangesRepository
} from "../src/infrastructure/PendingSyncChangesRepository.js";
import {
    CloudGateway
} from "../src/infrastructure/CloudGateway.js";
import { SyncEngine } from "../src/core/SyncEngine.js";

class MemoryStorage {
    constructor() {
        this.data = new Map();
    }
    getItem(key) {
        return this.data.get(key) ?? null;
    }
    setItem(key, value) {
        this.data.set(key, String(value));
    }
    removeItem(key) {
        this.data.delete(key);
    }
}

function backup(data = {}) {
    return {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt: "2026-09-12T10:00:00.000Z",
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            goals: [],
            customFilters: [],
            activityEvents: [],
            ...data
        }
    };
}

test("coalesce cambios repetidos como diferencia neta create update delete", () => {
    const base = backup({
        tasks: [
            { id: "updated", version: 1, title: "Antes" },
            { id: "deleted", version: 1, title: "Borrar" }
        ]
    });
    const current = backup({
        tasks: [
            { id: "updated", version: 3, title: "Final" },
            { id: "created", version: 2, title: "Creada y editada" }
        ]
    });

    const changes = createIncrementalChanges(base, current)
        .filter(change => change.collection === "tasks");

    assert.deepEqual(
        changes.map(change => [change.id, change.operation]),
        [
            ["updated", "update"],
            ["deleted", "delete"],
            ["created", "create"]
        ]
    );
    assert.equal(changes[0].value.title, "Final");
    assert.equal(changes[2].value.title, "Creada y editada");
});

test("el registro pendiente persiste por endpoint y revisión base", () => {
    const storage = new MemoryStorage();
    const first = new PendingSyncChangesRepository(storage);

    first.replace({
        endpoint: "https://example.com/exec",
        baseRevision: 7,
        changes: [{
            collection: "tasks",
            id: "task-1",
            operation: "delete"
        }]
    });

    const restored = new PendingSyncChangesRepository(storage)
        .get("https://example.com/exec");

    assert.equal(restored.baseRevision, 7);
    assert.equal(restored.changes.length, 1);
    assert.equal(
        first.get("https://other.example.com/exec"),
        null
    );
});

test("CloudGateway envía sólo el lote incremental y baseRevision", async () => {
    let requestBody;
    const gateway = new CloudGateway({
        fetchFn: async (_url, options) => {
            requestBody = JSON.parse(options.body);
            return {
                ok: true,
                async json() {
                    return { ok: true, revision: 9 };
                }
            };
        }
    });

    await gateway.saveIncremental({
        url: "https://example.com/exec",
        token: "secret",
        baseRevision: 8,
        changes: [{
            collection: "tasks",
            id: "task-1",
            operation: "delete"
        }]
    });

    assert.equal(requestBody.action, "saveIncremental");
    assert.equal(requestBody.baseRevision, 8);
    assert.equal(requestBody.data, undefined);
    assert.equal(requestBody.changes.length, 1);
});

test("SyncEngine usa incremental con base conocida y registra métricas", async () => {
    const unchanged = Array.from(
        { length: 20 },
        (_, index) => ({
            id: `unchanged-${index}`,
            version: 1,
            title: `Tarea sin cambios ${index}`
        })
    );
    const base = backup({
        tasks: [
            ...unchanged,
            { id: "task-1", version: 1, title: "Antes" }
        ]
    });
    const current = backup({
        tasks: [
            ...unchanged,
            { id: "task-1", version: 2, title: "Después" }
        ]
    });
    let incrementalRequest;
    let fullSaves = 0;
    const metrics = [];
    const config = {
        isConfigured: () => true,
        get: () => ({
            url: "https://example.com/exec",
            token: "secret"
        }),
        getRevision: () => 5,
        setRevision() {},
        markSynchronized() {}
    };
    const pendingRepository = {
        replace(state) {
            this.state = state;
            return state;
        },
        clear() {
            this.cleared = true;
        }
    };
    const engine = new SyncEngine({
        backupService: {
            createBackup: () => current,
            parseAndValidate: () => current.data
        },
        config,
        gateway: {
            async saveIncremental(request) {
                incrementalRequest = request;
                return { ok: true, revision: 6 };
            },
            async save() {
                fullSaves += 1;
            }
        },
        baseSnapshotRepository: {
            get: () => base
        },
        pendingChangesRepository: pendingRepository,
        metricsRepository: {
            add(metric) {
                metrics.push(metric);
            }
        }
    });

    const result = await engine.push();

    assert.equal(result.syncMode, "incremental");
    assert.equal(fullSaves, 0);
    assert.equal(incrementalRequest.baseRevision, 5);
    assert.equal(incrementalRequest.changes.length, 1);
    assert.equal(incrementalRequest.changes[0].operation, "update");
    assert.equal(pendingRepository.cleared, true);
    assert.equal(metrics[0].mode, "incremental");
    assert.ok(metrics[0].requestBytes < metrics[0].fullSnapshotBytes);
});

test("Apps Script aplica un lote incremental y rechaza duplicados", () => {
    const source = readFileSync(
        new URL("../google-apps-script/Code.gs", import.meta.url),
        "utf8"
    );
    const backend = { console };
    vm.createContext(backend);
    vm.runInContext(source, backend);

    const state = backup({
        tasks: [
            { id: "task-1", version: 1, title: "Antes" },
            { id: "task-2", version: 1, title: "Borrar" }
        ]
    });
    const changes = [
        {
            collection: "tasks",
            id: "task-1",
            operation: "update",
            value: { id: "task-1", version: 2, title: "Después" }
        },
        {
            collection: "tasks",
            id: "task-2",
            operation: "delete"
        },
        {
            collection: "tasks",
            id: "task-3",
            operation: "create",
            value: { id: "task-3", version: 1, title: "Nueva" }
        }
    ];

    backend.validateIncrementalChanges_(changes);
    backend.applyIncrementalChanges_(state, changes);

    assert.deepEqual(
        JSON.parse(JSON.stringify(state.data.tasks)),
        [
            { id: "task-1", version: 2, title: "Después" },
            { id: "task-3", version: 1, title: "Nueva" }
        ]
    );
    assert.throws(
        () => backend.validateIncrementalChanges_([
            changes[0],
            changes[0]
        ]),
        error => error.code === "INVALID_CHANGES"
    );
});

test("Apps Script protege el incremental con baseRevision", () => {
    const source = readFileSync(
        new URL("../google-apps-script/Code.gs", import.meta.url),
        "utf8"
    );
    const backend = { console };
    vm.createContext(backend);
    vm.runInContext(source, backend);

    assert.doesNotThrow(
        () => backend.validateBaseRevision_(4, 4)
    );
    assert.throws(
        () => backend.validateBaseRevision_(3, 4),
        error =>
            error.code === "CONFLICT" &&
            error.remoteRevision === 4
    );
});
