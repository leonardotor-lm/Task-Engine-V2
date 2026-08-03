import assert from "node:assert/strict";
import test from "node:test";

import { View } from "../src/core/View.js";
import { ViewRouter } from "../src/ui/ViewRouter.js";

function render(overrides = {}) {
    return new ViewRouter().render({
        view: View.ALL,
        tasks: [],
        allTasks: [],
        areas: [],
        contexts: [],
        tags: [],
        goals: [],
        searchQuery: "",
        advancedSearchMode: false,
        expandedTaskIds: new Set(),
        selectedTaskIds: new Set(),
        taskViewCounts: {},
        ...overrides
    });
}

test("advierte discretamente cuando la búsqueda avanzada está activa", () => {
    const html = render({
        advancedSearchMode: true,
        searchQuery: 'objetivo:"Lectura & escritura"'
    });

    assert.match(html, /Búsqueda avanzada activa/);
    assert.match(
        html,
        /objetivo:&quot;Lectura &amp; escritura&quot;/
    );
    assert.match(
        html,
        /id="clearActiveAdvancedSearch"/
    );
});

test("no muestra la leyenda en una vista normal", () => {
    assert.doesNotMatch(
        render(),
        /advancedSearchActiveNotice/
    );
});
