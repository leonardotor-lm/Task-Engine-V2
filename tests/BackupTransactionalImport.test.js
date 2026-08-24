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

class FailableRepository {

    constructor(items = []) {
        this.items = [...items];
        this.failNextReplace = false;
    }

    getAll() {
        return [...this.items];
    }

    replaceAll(items) {
        this.items = [...items];

        if (this.failNextReplace) {
            this.failNextReplace = false;
            throw new Error("fallo de persistencia local");
        }
    }

}

function createState(prefix) {

    const area = new Area({
        id: `${prefix}-area`,
        name: `${prefix} área`
    });
    const context = new Context({
        id: `${prefix}-context`,
        name: `${prefix} contexto`
    });
    const tag = new Tag({
        id: `${prefix}-tag`,
        name: `${prefix} etiqueta`
    });
    const task = new Task({
        id: `${prefix}-task`,
        title: `${prefix} tarea`,
        areaId: area.id,
        contextId: context.id,
        tagIds: [tag.id]
    });

    return {
        task,
        area,
        context,
        tag
    };

}

function createBackup(state) {

    return JSON.stringify({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: "2026-08-24T12:00:00.000Z",
        data: {
            tasks: [state.task.toJSON()],
            areas: [state.area.toJSON()],
            contexts: [state.context.toJSON()],
            tags: [state.tag.toJSON()],
            customFilters: [],
            goals: [],
            activityEvents: []
        }
    });

}

function setup() {

    const initial = createState("initial");
    const repositories = {
        taskRepository:
            new FailableRepository([initial.task]),
        areaRepository:
            new FailableRepository([initial.area]),
        contextRepository:
            new FailableRepository([initial.context]),
        tagRepository:
            new FailableRepository([initial.tag])
    };
    const storage = new MemoryStorage();
    const service = new BackupService({
        ...repositories,
        storage
    });

    return {
        initial,
        repositories,
        storage,
        service
    };

}

function assertState(repositories, state) {

    assert.equal(
        repositories.taskRepository.getAll()[0].id,
        state.task.id
    );
    assert.equal(
        repositories.areaRepository.getAll()[0].id,
        state.area.id
    );
    assert.equal(
        repositories.contextRepository.getAll()[0].id,
        state.context.id
    );
    assert.equal(
        repositories.tagRepository.getAll()[0].id,
        state.tag.id
    );

}

test("revierte toda la importación si una colección falla a mitad", () => {

    const {
        initial,
        repositories,
        storage,
        service
    } = setup();
    const incoming = createState("incoming");

    repositories.contextRepository
        .failNextReplace = true;

    assert.throws(
        () => service.importBackup(
            createBackup(incoming)
        ),
        /fallo de persistencia local/
    );

    assertState(repositories, initial);
    assert.ok(
        storage.getItem(LAST_IMPORT_BACKUP_KEY)
    );

});

test("una restauración fallida conserva el estado actual y la copia recuperable", () => {

    const {
        repositories,
        storage,
        service
    } = setup();
    const imported = createState("imported");

    service.importBackup(
        createBackup(imported)
    );

    repositories.areaRepository
        .failNextReplace = true;

    assert.throws(
        () => service.restoreLastImportBackup(),
        /fallo de persistencia local/
    );

    assertState(repositories, imported);
    assert.ok(
        storage.getItem(LAST_IMPORT_BACKUP_KEY)
    );

});
