import test from "node:test";
import assert from "node:assert/strict";
import {
    TaskFilterSyncBridge
} from "../src/core/TaskFilterSyncBridge.js";
import {
    createSyncFingerprint
} from "../src/core/SyncFingerprint.js";
import {
    BACKUP_FORMAT,
    BACKUP_VERSION,
    BackupService
} from "../src/core/BackupService.js";
import { Task } from "../src/domain/Task.js";
import {
    TaskFilterPreferencesRepository
} from "../src/infrastructure/TaskFilterPreferencesRepository.js";

class MemoryRepository {

    constructor(items = []) {
        this.items = [...items];
    }

    getAll() {
        return [...this.items];
    }

    replaceAll(items) {
        this.items = [...items];
    }

}

class FaultyStorage {

    constructor() {
        this.values = new Map();
        this.failedWriteKey = null;
    }

    getItem(key) {
        return this.values.get(key) ?? null;
    }

    setItem(key, value) {
        if (key === this.failedWriteKey) {
            this.failedWriteKey = null;
            throw new Error(
                "fallo al guardar filtros rápidos"
            );
        }
        this.values.set(key, String(value));
    }

    removeItem(key) {
        this.values.delete(key);
    }

    failNextWriteTo(key) {
        this.failedWriteKey = key;
    }

}

function baseBackup() {

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
            taskSortPreferences: {}
        }
    };

}

function createHarness() {

    let preferences = {
        "view:today": {
            areaId: "",
            contextId: "",
            tagId: "tag-1",
            priority: "",
            due: ""
        }
    };

    const repository = {
        getAll() {
            return structuredClone(preferences);
        },
        normalizeAll(value) {
            return structuredClone(value ?? {});
        },
        replaceAll(value) {
            preferences = structuredClone(value);
        }
    };

    const backupService = {
        applied: null,
        createBackup() {
            return baseBackup();
        },
        parseAndValidate(json) {
            return JSON.parse(json).data;
        },
        applyData(data) {
            this.applied = data;
        }
    };

    const app = {
        backupService,
        taskFilterPreferencesRepository:
            repository
    };

    new TaskFilterSyncBridge(app).start();

    return {
        backupService,
        repository,
        getPreferences: () =>
            structuredClone(preferences)
    };

}

test("incluye preferencias de filtros rápidos en la copia sincronizada", () => {

    const { backupService } = createHarness();
    const backup = backupService.createBackup();

    assert.equal(
        backup.data
            .taskFilterPreferences["view:today"]
            .tagId,
        "tag-1"
    );

});

test("una copia antigua sin preferencias no borra las locales", () => {

    const {
        backupService,
        getPreferences
    } = createHarness();
    const data = backupService.parseAndValidate(
        JSON.stringify(baseBackup())
    );

    assert.equal(
        data.taskFilterPreferences,
        null
    );

    backupService.applyData(data);

    assert.equal(
        getPreferences()["view:today"].tagId,
        "tag-1"
    );

});

test("una copia actual puede reemplazar preferencias de filtros rápidos", () => {

    const {
        backupService,
        getPreferences
    } = createHarness();
    const backup = baseBackup();

    backup.data.taskFilterPreferences = {
        "view:inbox": {
            areaId: "",
            contextId: "context-2",
            tagId: "",
            priority: "",
            due: ""
        }
    };

    const data = backupService.parseAndValidate(
        JSON.stringify(backup)
    );

    backupService.applyData(data);

    assert.equal(
        getPreferences()["view:inbox"].contextId,
        "context-2"
    );
    assert.equal(
        getPreferences()["view:today"],
        undefined
    );

});

test("la huella de sincronización cambia cuando cambia un filtro rápido guardado", () => {

    const first = baseBackup();
    const second = baseBackup();

    first.data.taskFilterPreferences = {
        "view:today": {
            priority: "2"
        }
    };
    second.data.taskFilterPreferences = {
        "view:today": {
            priority: "4"
        }
    };

    assert.notEqual(
        createSyncFingerprint(first),
        createSyncFingerprint(second)
    );

});

test("revierte los datos si falla una preferencia de filtro rápido", () => {

    const storage = new FaultyStorage();
    const localTask = new Task({
        id: "task-local",
        title: "Tarea local"
    });
    const taskRepository =
        new MemoryRepository([localTask]);
    const repository =
        new TaskFilterPreferencesRepository(
            storage
        );

    repository.set("view:today", {
        priority: "2"
    });

    const backupService = new BackupService({
        taskRepository,
        areaRepository: new MemoryRepository(),
        contextRepository: new MemoryRepository(),
        tagRepository: new MemoryRepository(),
        storage
    });

    new TaskFilterSyncBridge({
        backupService,
        taskFilterPreferencesRepository:
            repository
    }).start();

    const backup = {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: "2026-08-24T12:00:00.000Z",
        data: {
            tasks: [{
                id: "task-remote",
                title: "Tarea remota"
            }],
            areas: [],
            contexts: [],
            tags: [],
            taskFilterPreferences: {
                "view:today": {
                    priority: "4"
                }
            }
        }
    };

    storage.failNextWriteTo(
        "task-engine-v2-task-filter-preferences-v1"
    );

    assert.throws(
        () => backupService.importBackup(
            JSON.stringify(backup)
        ),
        /fallo al guardar filtros rápidos/
    );

    assert.deepEqual(
        taskRepository
            .getAll()
            .map(task => task.id),
        ["task-local"]
    );
    assert.equal(
        repository.get("view:today").priority,
        "2"
    );

});
