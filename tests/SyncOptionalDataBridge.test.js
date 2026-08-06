import test from "node:test";
import assert from "node:assert/strict";

import {
    BACKUP_FORMAT,
    BACKUP_VERSION,
    BackupService
} from "../src/core/BackupService.js";
import {
    SyncOptionalDataBridge
} from "../src/core/SyncOptionalDataBridge.js";
import { TaskSort } from "../src/core/TaskSorting.js";
import { CustomFilter } from "../src/domain/CustomFilter.js";
import {
    TaskSortPreferencesRepository
} from "../src/infrastructure/TaskSortPreferencesRepository.js";

class MemoryStorage {

    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.get(key) ?? null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }

    removeItem(key) {
        this.values.delete(key);
    }

}

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

function createBackupData(overrides = {}) {

    return JSON.stringify({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: "2026-08-06T12:00:00.000Z",
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            ...overrides
        }
    });

}

function setup() {

    const storage = new MemoryStorage();
    const customFilterRepository =
        new MemoryRepository([
            new CustomFilter({
                id: "filter-local",
                name: "Filtro local",
                query: "priority:high"
            })
        ]);
    const taskSortPreferencesRepository =
        new TaskSortPreferencesRepository(
            storage
        );

    taskSortPreferencesRepository.set(
        "view:today",
        TaskSort.PRIORITY
    );

    const backupService = new BackupService({
        taskRepository: new MemoryRepository(),
        areaRepository: new MemoryRepository(),
        contextRepository: new MemoryRepository(),
        tagRepository: new MemoryRepository(),
        customFilterRepository,
        storage
    });

    const app = {
        backupService,
        taskSortPreferencesRepository
    };

    new SyncOptionalDataBridge(app).start();

    return {
        backupService,
        customFilterRepository,
        taskSortPreferencesRepository
    };

}

test("incluye las preferencias de orden en las copias nuevas", () => {

    const {
        backupService
    } = setup();

    const backup =
        backupService.createBackup();

    assert.deepEqual(
        backup.data.taskSortPreferences,
        {
            "view:today": TaskSort.PRIORITY
        }
    );

});

test("una copia antigua conserva filtros y órdenes locales", () => {

    const {
        backupService,
        customFilterRepository,
        taskSortPreferencesRepository
    } = setup();

    backupService.importBackup(
        createBackupData()
    );

    assert.equal(
        customFilterRepository.getAll().length,
        1
    );
    assert.equal(
        customFilterRepository.getAll()[0].id,
        "filter-local"
    );
    assert.equal(
        taskSortPreferencesRepository.get(
            "view:today"
        ),
        TaskSort.PRIORITY
    );

});

test("colecciones presentes y vacías eliminan datos de forma intencional", () => {

    const {
        backupService,
        customFilterRepository,
        taskSortPreferencesRepository
    } = setup();

    backupService.importBackup(
        createBackupData({
            customFilters: [],
            goals: [],
            taskSortPreferences: {}
        })
    );

    assert.equal(
        customFilterRepository.getAll().length,
        0
    );
    assert.deepEqual(
        taskSortPreferencesRepository.getAll(),
        {}
    );

});

test("importa filtros y órdenes enviados por otro dispositivo", () => {

    const {
        backupService,
        customFilterRepository,
        taskSortPreferencesRepository
    } = setup();

    backupService.importBackup(
        createBackupData({
            customFilters: [{
                id: "filter-remote",
                name: "Filtro remoto",
                query: "due:today",
                version: 1
            }],
            goals: [],
            taskSortPreferences: {
                "view:today":
                    TaskSort.CREATED_NEWEST,
                "area:area-1":
                    TaskSort.DUE_DATE
            }
        })
    );

    assert.deepEqual(
        customFilterRepository
            .getAll()
            .map(filter => filter.id),
        ["filter-remote"]
    );
    assert.equal(
        taskSortPreferencesRepository.get(
            "view:today"
        ),
        TaskSort.CREATED_NEWEST
    );
    assert.equal(
        taskSortPreferencesRepository.get(
            "area:area-1"
        ),
        TaskSort.DUE_DATE
    );

});

test("rechaza preferencias de orden remotas inválidas", () => {

    const { backupService } = setup();

    assert.throws(
        () => backupService.importBackup(
            createBackupData({
                customFilters: [],
                taskSortPreferences: {
                    "view:today": "INVALID"
                }
            })
        ),
        /preferencia de orden inválida/
    );

});
