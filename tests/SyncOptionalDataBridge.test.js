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
import {
    TaskDisplayPreferences
} from "../src/infrastructure/TaskDisplayPreferences.js";
import { Task } from "../src/domain/Task.js";

class MemoryStorage {

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
                "fallo al guardar preferencias visuales"
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
    const taskDisplayPreferences =
        new TaskDisplayPreferences(storage);
    const taskRepository =
        new MemoryRepository([
            new Task({
                id: "task-local",
                title: "Tarea local"
            })
        ]);

    taskSortPreferencesRepository.set(
        "view:today",
        TaskSort.PRIORITY
    );
    taskDisplayPreferences.setSidebarTitle(
        "Tareas de Leo"
    );

    const backupService = new BackupService({
        taskRepository,
        areaRepository: new MemoryRepository(),
        contextRepository: new MemoryRepository(),
        tagRepository: new MemoryRepository(),
        customFilterRepository,
        storage
    });

    const app = {
        backupService,
        taskSortPreferencesRepository,
        taskDisplayPreferences
    };

    new SyncOptionalDataBridge(app).start();

    return {
        backupService,
        storage,
        taskRepository,
        customFilterRepository,
        taskSortPreferencesRepository,
        taskDisplayPreferences
    };

}

test("revierte datos y preferencias si falla el título lateral", () => {

    const {
        backupService,
        storage,
        taskRepository,
        taskSortPreferencesRepository,
        taskDisplayPreferences
    } = setup();

    storage.failNextWriteTo(
        "task-engine-v2-sidebar-title"
    );

    assert.throws(
        () => backupService.importBackup(
            createBackupData({
                tasks: [{
                    id: "task-remote",
                    title: "Tarea remota"
                }],
                customFilters: [],
                goals: [],
                taskSortPreferences: {
                    "view:today":
                        TaskSort.CREATED_NEWEST
                },
                displayPreferences: {
                    sidebarTitle: "Trabajo"
                }
            })
        ),
        /fallo al guardar preferencias visuales/
    );

    assert.deepEqual(
        taskRepository
            .getAll()
            .map(task => task.id),
        ["task-local"]
    );
    assert.equal(
        taskSortPreferencesRepository.get(
            "view:today"
        ),
        TaskSort.PRIORITY
    );
    assert.equal(
        taskDisplayPreferences.getSidebarTitle(),
        "Tareas de Leo"
    );

});

test("incluye las preferencias sincronizables en las copias nuevas", () => {

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
    assert.deepEqual(
        backup.data.displayPreferences,
        {
            sidebarTitle: "Tareas de Leo"
        }
    );
    assert.equal(
        Object.hasOwn(
            backup.data.displayPreferences,
            "theme"
        ),
        false
    );

});

test("una copia antigua conserva filtros y órdenes locales", () => {

    const {
        backupService,
        customFilterRepository,
        taskSortPreferencesRepository,
        taskDisplayPreferences
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
    assert.equal(
        taskDisplayPreferences.getSidebarTitle(),
        "Tareas de Leo"
    );
    assert.equal(
        taskDisplayPreferences.getTheme(),
        "default"
    );

});

test("colecciones presentes y vacías eliminan datos de forma intencional", () => {

    const {
        backupService,
        customFilterRepository,
        taskSortPreferencesRepository,
        taskDisplayPreferences
    } = setup();

    backupService.importBackup(
        createBackupData({
            customFilters: [],
            goals: [],
            taskSortPreferences: {},
            displayPreferences: {}
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
    assert.equal(
        taskDisplayPreferences.getSidebarTitle(),
        ""
    );
    assert.equal(
        taskDisplayPreferences.getTheme(),
        "default"
    );

});

test("importa filtros y órdenes enviados por otro dispositivo", () => {

    const {
        backupService,
        customFilterRepository,
        taskSortPreferencesRepository,
        taskDisplayPreferences
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
            },
            displayPreferences: {
                sidebarTitle: "Trabajo"
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
    assert.equal(
        taskDisplayPreferences.getSidebarTitle(),
        "Trabajo"
    );
    assert.equal(
        taskDisplayPreferences.getTheme(),
        "default"
    );

});

test("ignora temas remotos y conserva el tema local", () => {

    const {
        backupService,
        taskDisplayPreferences
    } = setup();

    taskDisplayPreferences.setTheme("dark");

    backupService.importBackup(
        createBackupData({
            displayPreferences: {
                sidebarTitle: "Trabajo",
                theme: "retro-dark"
            }
        })
    );

    assert.equal(
        taskDisplayPreferences.getSidebarTitle(),
        "Trabajo"
    );
    assert.equal(
        taskDisplayPreferences.getTheme(),
        "dark"
    );

});

test("ignora preferencias visuales desconocidas de versiones futuras", () => {

    const {
        backupService,
        taskDisplayPreferences
    } = setup();

    taskDisplayPreferences.setTheme("dark");

    backupService.importBackup(
        createBackupData({
            displayPreferences: {
                sidebarTitle: "Trabajo",
                theme: "future-theme",
                futureVisualPreference: true
            }
        })
    );

    assert.equal(
        taskDisplayPreferences.getSidebarTitle(),
        "Trabajo"
    );
    assert.equal(
        taskDisplayPreferences.getTheme(),
        "dark"
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

test("rechaza títulos laterales remotos inválidos", () => {

    const { backupService } = setup();

    assert.throws(
        () => backupService.importBackup(
            createBackupData({
                displayPreferences: {
                    sidebarTitle: "x".repeat(41)
                }
            })
        ),
        /título lateral inválido/
    );

});
