import test from "node:test";
import assert from "node:assert/strict";

import {
    getRedundantMetadataSelectors
} from "../src/ui/TaskGroupingController.js";
import {
    TaskGrouping
} from "../src/infrastructure/TaskGroupingPreferencesRepository.js";

function selectors(app = {}, grouping = TaskGrouping.NONE) {
    return getRedundantMetadataSelectors(
        {
            advancedSearchMode: false,
            currentCustomFilterId: null,
            taskFilters: {},
            ...app
        },
        grouping
    );
}

test("oculta sólo el metadato representado por el agrupamiento", () => {
    assert.deepEqual(
        selectors({}, TaskGrouping.AREA),
        [".taskMetaArea"]
    );
    assert.deepEqual(
        selectors({}, TaskGrouping.CONTEXT),
        [".taskMetaContext"]
    );
    assert.deepEqual(
        selectors({}, TaskGrouping.DATE),
        [".taskDueDate"]
    );
    assert.deepEqual(
        selectors({}, TaskGrouping.PROJECT),
        []
    );
});

test("los filtros rápidos inequívocos ocultan su metadato redundante", () => {
    assert.deepEqual(
        selectors({
            taskFilters: { areaId: "personal" }
        }).sort(),
        [".taskMetaArea"]
    );
    assert.deepEqual(
        selectors({
            taskFilters: { contextId: "casa" }
        }).sort(),
        [".taskMetaContext"]
    );
    assert.deepEqual(
        selectors({
            taskFilters: { due: "TODAY" }
        }).sort(),
        [".taskDueDate"]
    );
});

test("los filtros rápidos por rango conservan la fecha visible", () => {
    for (const due of ["OVERDUE", "UPCOMING"]) {
        assert.deepEqual(
            selectors({ taskFilters: { due } }),
            []
        );
    }
});

test("agrupamiento y filtro del mismo campo no duplican selectores", () => {
    assert.deepEqual(
        selectors(
            { taskFilters: { areaId: "personal" } },
            TaskGrouping.AREA
        ),
        [".taskMetaArea"]
    );
});

test("la búsqueda avanzada conserva siempre todos los metadatos", () => {
    assert.deepEqual(
        selectors(
            {
                advancedSearchMode: true,
                taskFilters: {
                    areaId: "personal",
                    contextId: "casa",
                    due: "TODAY"
                }
            },
            TaskGrouping.AREA
        ),
        []
    );
});

test("los filtros personalizados guardados no se reinterpretan como filtros simples", () => {
    assert.deepEqual(
        selectors(
            {
                currentCustomFilterId: "filtro-1",
                taskFilters: { areaId: "personal" }
            },
            TaskGrouping.AREA
        ),
        []
    );
});
