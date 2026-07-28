import test from "node:test";
import assert from "node:assert/strict";

import {
    BACKUP_FORMAT,
    BACKUP_VERSION,
    BackupService
} from "../src/core/BackupService.js";
import {
    createSyncFingerprint
} from "../src/core/SyncFingerprint.js";
import { CustomFilter } from "../src/domain/CustomFilter.js";

function repository(items = []) {

    return {
        items: [...items],

        getAll() {
            return [...this.items];
        },

        replaceAll(nextItems) {
            this.items = [...nextItems];
        }
    };

}

function createService(
    customFilterRepository
) {

    return new BackupService({
        taskRepository: repository(),
        areaRepository: repository(),
        contextRepository: repository(),
        tagRepository: repository(),
        customFilterRepository,
        storage: {
            getItem() {
                return null;
            },
            setItem() {},
            removeItem() {}
        }
    });

}

test("incluye los filtros personalizados en la copia", () => {

    const filters = repository([
        new CustomFilter({
            name: "Urgentes",
            query: "prioridad:critica"
        })
    ]);

    const backup =
        createService(filters)
            .createBackup();

    assert.equal(
        backup.data.customFilters.length,
        1
    );

    assert.equal(
        backup.data.customFilters[0].name,
        "Urgentes"
    );

});

test("acepta copias anteriores sin filtros personalizados", () => {

    const service =
        createService(repository());

    const oldBackup = {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt:
            new Date().toISOString(),
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: []
        }
    };

    const data =
        service.parseAndValidate(
            JSON.stringify(oldBackup)
        );

    assert.deepEqual(
        data.customFilters,
        []
    );

});

test("restaura filtros personalizados desde una copia", () => {

    const filters = repository();
    const service = createService(filters);

    const backup = {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt:
            new Date().toISOString(),
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            customFilters: [
                {
                    id: "filter-1",
                    name: "Próximas urgentes",
                    query:
                        "fecha:proxima AND prioridad:alta",
                    version: 1,
                    createdAt:
                        "2026-07-27T00:00:00.000Z",
                    updatedAt:
                        "2026-07-27T00:00:00.000Z"
                }
            ]
        }
    };

    const data =
        service.parseAndValidate(
            JSON.stringify(backup)
        );

    service.applyData(data);

    assert.equal(
        filters.getAll()[0].id,
        "filter-1"
    );

});

test("la huella de sincronización detecta filtros", () => {

    const base = {
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            customFilters: []
        }
    };

    const changed = {
        data: {
            ...base.data,
            customFilters: [
                {
                    id: "filter-1",
                    version: 1
                }
            ]
        }
    };

    assert.notEqual(
        createSyncFingerprint(base),
        createSyncFingerprint(changed)
    );

});

test("la huella acepta datos antiguos sin filtros", () => {

    assert.doesNotThrow(() =>
        createSyncFingerprint({
            data: {
                tasks: [],
                areas: [],
                contexts: [],
                tags: []
            }
        })
    );

});
