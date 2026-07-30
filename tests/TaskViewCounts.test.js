import assert from "node:assert/strict";
import test from "node:test";

import { View } from "../src/core/View.js";
import { ViewRouter } from "../src/ui/ViewRouter.js";

function render(view, overrides = {}) {

    return new ViewRouter().render({
        view,
        tasks: [],
        allTasks: [],
        areas: [],
        contexts: [],
        tags: [],
        goals: [],
        searchQuery: "",
        expandedTaskIds: new Set(),
        filtersActive: false,
        selectedTaskIds: new Set(),
        bulkSelectionEnabled: false,
        bulkActionMode: null,
        showTaskMetadata: true,
        today: "2026-07-29",
        taskViewCounts: {
            inbox: 2,
            today: 10,
            tomorrow: 3,
            upcoming: 7,
            all: 22,
            "area:area-1": 5
        },
        ...overrides
    });

}

test("los títulos temporales muestran tareas pendientes", () => {

    assert.match(
        render(View.TODAY),
        /<h2>Hoy y atrasadas \(10\)<\/h2>/
    );
    assert.match(
        render(View.TOMORROW),
        /<h2>Mañana \(3\)<\/h2>/
    );
    assert.match(
        render(View.UPCOMING),
        /<h2>Próximas \(7\)<\/h2>/
    );

});

test("Todas y las áreas muestran su contador", () => {

    assert.match(
        render(View.ALL),
        /<h2>Todas \(22\)<\/h2>/
    );
    assert.match(
        render(
            View.AREA,
            {
                activeArea: {
                    id: "area-1",
                    name: "Trabajo"
                }
            }
        ),
        /<h2>Trabajo \(5\)<\/h2>/
    );

});
