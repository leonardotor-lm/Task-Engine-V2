import test from "node:test";
import assert from "node:assert/strict";

import { App } from "../src/core/App.js";
import { View } from "../src/core/View.js";

test("cambiar de vista desactiva y limpia la selección múltiple", () => {

    const app = Object.create(App.prototype);

    app.currentView = View.TRASH;
    app.bulkSelectionMode = true;
    app.selectedTaskIds = new Set([
        "task-1",
        "task-2"
    ]);
    app.selectedTask = {
        id: "task-1"
    };

    let renders = 0;
    app.render = () => {
        renders += 1;
    };

    app.navigateTo(View.ARCHIVED);

    assert.equal(
        app.currentView,
        View.ARCHIVED
    );
    assert.equal(
        app.bulkSelectionMode,
        false
    );
    assert.equal(
        app.selectedTaskIds.size,
        0
    );
    assert.equal(app.selectedTask, null);
    assert.equal(renders, 1);

});

test("cambiar de vista desactiva por completo el filtro guardado", () => {

    const app = Object.create(App.prototype);

    app.currentView = View.ALL;
    app.currentCustomFilterId = "filter-1";
    app.searchQuery = "prioridad:alta";
    app.advancedSearchMode = true;
    app.advancedSearchDialogOpen = false;
    app.advancedSearchExpression = {
        type: "FIELD"
    };
    app.advancedSearchError = "";
    app.bulkSelectionMode = false;
    app.taskToolsDialogOpen = false;
    app.selectedTaskIds = new Set();
    app.selectedTask = null;
    app.currentAreaId = null;
    app.render = () => {};

    app.navigateTo(View.TODAY);

    assert.equal(app.currentView, View.TODAY);
    assert.equal(app.currentCustomFilterId, null);
    assert.equal(app.searchQuery, "");
    assert.equal(app.advancedSearchMode, false);
    assert.equal(app.advancedSearchExpression, null);
    assert.equal(app.advancedSearchError, "");

});
