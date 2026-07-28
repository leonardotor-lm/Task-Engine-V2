import test from "node:test";
import assert from "node:assert/strict";

import { CustomFilter } from "../src/domain/CustomFilter.js";
import { CustomFilterService } from "../src/core/CustomFilterService.js";
import { CustomFilterRepository } from "../src/infrastructure/CustomFilterRepository.js";

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

}

test("crea y persiste un filtro personalizado", () => {

    const storage = new MemoryStorage();
    const service =
        new CustomFilterService(
            new CustomFilterRepository(storage)
        );

    const filter = service.createFilter({
        name: "Urgentes de trabajo",
        query:
            "prioridad:critica AND area:Trabajo"
    });

    assert.equal(
        filter.name,
        "Urgentes de trabajo"
    );

    const restored =
        new CustomFilterService(
            new CustomFilterRepository(storage)
        );

    assert.equal(
        restored.getAllFilters().length,
        1
    );

    assert.equal(
        restored.getAllFilters()[0].query,
        "prioridad:critica AND area:Trabajo"
    );

});

test("rechaza consultas inválidas", () => {

    const service =
        new CustomFilterService(
            new CustomFilterRepository(
                new MemoryStorage()
            )
        );

    assert.throws(
        () => service.createFilter({
            name: "Inválido",
            query: "campoInexistente:valor"
        }),
        /no existe/
    );

});

test("no permite nombres duplicados", () => {

    const service =
        new CustomFilterService(
            new CustomFilterRepository(
                new MemoryStorage()
            )
        );

    service.createFilter({
        name: "Tareas urgentes",
        query: "prioridad:alta"
    });

    assert.throws(
        () => service.createFilter({
            name: "tareas urgentes",
            query: "prioridad:critica"
        }),
        /Ya existe/
    );

});

test("actualiza versión y consulta", () => {

    const filter = new CustomFilter({
        name: "Inicial",
        query: "fecha:hoy"
    });

    const initialVersion =
        filter.version;

    filter.update({
        name: "Hoy y atrasadas",
        query:
            "fecha:hoy OR fecha:atrasada"
    });

    assert.equal(
        filter.version,
        initialVersion + 1
    );

    assert.equal(
        filter.name,
        "Hoy y atrasadas"
    );

});

test("elimina un filtro existente", () => {

    const service =
        new CustomFilterService(
            new CustomFilterRepository(
                new MemoryStorage()
            )
        );

    const filter = service.createFilter({
        name: "Temporal",
        query: "recurrente:si"
    });

    assert.equal(
        service.deleteFilter(filter.id),
        true
    );

    assert.deepEqual(
        service.getAllFilters(),
        []
    );

});
