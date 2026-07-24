import test from "node:test";
import assert from "node:assert/strict";

import {
    DueDateFilter,
    filterTaskTreeByCriteria,
    hasActiveTaskFilters,
    matchesTaskFilters
} from "../src/core/TaskFilters.js";

function task(overrides = {}) {

    return {
        id: overrides.id ?? crypto.randomUUID(),
        title: overrides.title ?? "Tarea",
        description: overrides.description ?? "",
        parentTaskId: overrides.parentTaskId ?? null,
        areaId: overrides.areaId ?? null,
        contextId: overrides.contextId ?? null,
        tagIds: overrides.tagIds ?? [],
        priority: overrides.priority ?? 0,
        dueDate: overrides.dueDate ?? null
    };

}

test("detecta si existen filtros activos", () => {

    assert.equal(hasActiveTaskFilters({}), false);
    assert.equal(
        hasActiveTaskFilters({ priority: "0" }),
        true
    );
    assert.equal(
        hasActiveTaskFilters({ areaId: "area-1" }),
        true
    );

});

test("combina área, contexto, etiqueta y prioridad con AND", () => {

    const matchingTask = task({
        areaId: "area-1",
        contextId: "context-1",
        tagIds: ["tag-1"],
        priority: 3
    });

    const filters = {
        areaId: "area-1",
        contextId: "context-1",
        tagId: "tag-1",
        priority: "3"
    };

    assert.equal(
        matchesTaskFilters(matchingTask, filters),
        true
    );

    assert.equal(
        matchesTaskFilters(
            { ...matchingTask, tagIds: ["tag-2"] },
            filters
        ),
        false
    );

});

test("filtra por estado relativo de fecha", () => {

    const today = "2026-07-24";

    assert.equal(
        matchesTaskFilters(
            task({ dueDate: today }),
            { due: DueDateFilter.TODAY },
            today
        ),
        true
    );

    assert.equal(
        matchesTaskFilters(
            task({ dueDate: "2026-07-23" }),
            { due: DueDateFilter.OVERDUE },
            today
        ),
        true
    );

    assert.equal(
        matchesTaskFilters(
            task({ dueDate: "2026-07-25" }),
            { due: DueDateFilter.UPCOMING },
            today
        ),
        true
    );

    assert.equal(
        matchesTaskFilters(
            task({ dueDate: null }),
            { due: DueDateFilter.NO_DATE },
            today
        ),
        true
    );

});

test("la búsqueda y los filtros deben coincidir en la misma tarea", () => {

    const parent = task({
        id: "parent",
        title: "Informe trimestral",
        areaId: "trabajo"
    });

    const child = task({
        id: "child",
        title: "Comprar materiales",
        parentTaskId: parent.id,
        areaId: "casa"
    });

    const result = filterTaskTreeByCriteria(
        [parent, child],
        {
            query: "Comprar",
            filters: { areaId: "trabajo" }
        }
    );

    assert.deepEqual(result, []);

});

test("conserva los ancestros de una subtarea coincidente", () => {

    const parent = task({
        id: "parent",
        title: "Proyecto"
    });

    const child = task({
        id: "child",
        title: "Preparar presentación",
        parentTaskId: parent.id,
        areaId: "trabajo"
    });

    const result = filterTaskTreeByCriteria(
        [parent, child],
        {
            query: "presentacion",
            filters: { areaId: "trabajo" }
        }
    );

    assert.deepEqual(
        result.map(item => item.id),
        ["parent", "child"]
    );

});
