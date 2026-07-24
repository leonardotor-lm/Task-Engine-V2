import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { Area } from "../src/domain/Area.js";
import { Context } from "../src/domain/Context.js";
import { Tag } from "../src/domain/Tag.js";
import {
    BACKUP_FORMAT,
    BACKUP_VERSION,
    LAST_IMPORT_BACKUP_KEY,
    BackupService
} from "../src/core/BackupService.js";

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

class MemoryRepository {

    constructor(items = []) {
        this.items = [...items];
        this.replacements = 0;
    }

    getAll() {
        return [...this.items];
    }

    replaceAll(items) {
        this.items = [...items];
        this.replacements += 1;
    }

}

function setup() {

    const area = new Area({
        id: "area-1",
        name: "Trabajo"
    });

    const context = new Context({
        id: "context-1",
        name: "Computadora"
    });

    const tag = new Tag({
        id: "tag-1",
        name: "Importante"
    });

    const task = new Task({
        id: "task-1",
        title: "Preparar clase",
        areaId: area.id,
        contextId: context.id,
        tagIds: [tag.id]
    });

    const repositories = {
        taskRepository:
            new MemoryRepository([task]),
        areaRepository:
            new MemoryRepository([area]),
        contextRepository:
            new MemoryRepository([context]),
        tagRepository:
            new MemoryRepository([tag])
    };

    const storage = new MemoryStorage();

    const service = new BackupService({
        ...repositories,
        storage
    });

    return {
        service,
        storage,
        repositories
    };

}

function validBackup(overrides = {}) {

    return JSON.stringify({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: "2026-07-24T10:00:00.000Z",
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            ...overrides
        }
    });

}

test("exporta todas las colecciones en un formato versionado", () => {

    const { service } = setup();
    const backup = JSON.parse(
        service.exportBackup()
    );

    assert.equal(backup.format, BACKUP_FORMAT);
    assert.equal(backup.version, BACKUP_VERSION);
    assert.equal(backup.data.tasks.length, 1);
    assert.equal(backup.data.areas.length, 1);
    assert.equal(backup.data.contexts.length, 1);
    assert.equal(backup.data.tags.length, 1);

});

test("rechaza un archivo inválido sin reemplazar datos", () => {

    const {
        service,
        repositories
    } = setup();

    assert.throws(
        () => service.importBackup("{invalid"),
        /JSON válido/
    );

    for (
        const repository of
        Object.values(repositories)
    ) {
        assert.equal(repository.replacements, 0);
    }

});

test("rechaza identificadores duplicados", () => {

    const { service } = setup();

    const area = {
        id: "duplicada",
        name: "Área"
    };

    assert.throws(
        () => service.importBackup(
            validBackup({
                areas: [area, area]
            })
        ),
        /identificadores duplicados/
    );

});

test("rechaza referencias de tareas inexistentes", () => {

    const { service } = setup();

    assert.throws(
        () => service.importBackup(
            validBackup({
                tasks: [{
                    id: "task-2",
                    title: "Tarea inválida",
                    areaId: "area-inexistente"
                }]
            })
        ),
        /área inexistente/
    );

});

test("importa datos válidos y guarda el estado anterior", () => {

    const {
        service,
        storage,
        repositories
    } = setup();

    const backup = validBackup({
        tasks: [{
            id: "task-2",
            title: "Tarea importada"
        }]
    });

    const result = service.importBackup(backup);

    assert.equal(result.tasks.length, 1);
    assert.equal(
        repositories.taskRepository
            .getAll()[0].title,
        "Tarea importada"
    );

    assert.ok(
        storage.getItem(LAST_IMPORT_BACKUP_KEY)
    );

});

test("restaura el estado anterior a la importación", () => {

    const {
        service,
        storage,
        repositories
    } = setup();

    service.importBackup(
        validBackup({
            tasks: [{
                id: "task-2",
                title: "Tarea importada"
            }]
        })
    );

    service.restoreLastImportBackup();

    assert.equal(
        repositories.taskRepository
            .getAll()[0].title,
        "Preparar clase"
    );

    assert.equal(
        storage.getItem(LAST_IMPORT_BACKUP_KEY),
        null
    );

});
