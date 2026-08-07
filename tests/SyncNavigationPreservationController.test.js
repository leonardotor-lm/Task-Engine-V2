import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { View } from "../src/core/View.js";
import {
    SyncNavigationPreservationController
} from "../src/ui/SyncNavigationPreservationController.js";

function createApp({
    currentView = View.TODAY,
    currentAreaId = null,
    existingAreaIds = [],
    existingTaskIds = [],
    existingGoalIds = [],
    filters = {}
} = {}) {

    const tasks = new Map(
        existingTaskIds.map(id => [id, { id }])
    );
    const areas = new Map(
        existingAreaIds.map(id => [id, { id }])
    );
    const goals = new Map(
        existingGoalIds.map(id => [id, { id }])
    );

    const app = {
        currentView,
        currentAreaId,
        projectTaskId: null,
        previousProjectView: View.TODAY,
        projectHistory: [],
        calendarMonth: "2026-08",
        calendarSelectedDate: "2026-08-07",
        currentGoalStatus: "ACTIVE",
        selectedGoal: null,
        selectedTask: null,
        currentCustomFilterId: null,
        searchQuery: "",
        advancedSearchMode: false,
        advancedSearchExpression: null,
        advancedSearchError: "",
        expandedTaskIds: new Set(),
        goalExpandedTaskIds: new Set(),
        bulkSelectionMode: false,
        selectedTaskIds: new Set(),
        settingsDialogOpen: false,
        settingsSection: null,
        autoSyncInProgress: false,
        syncCheckInProgress: false,
        taskService: {
            getTaskById(id) {
                return tasks.get(id) ?? null;
            }
        },
        areaService: {
            getAreaById(id) {
                return areas.get(id) ?? null;
            }
        },
        goalService: {
            getGoalById(id) {
                return goals.get(id) ?? null;
            }
        },
        customFilterService: {
            getFilterById(id) {
                return filters[id] ?? null;
            }
        },
        resetTransientState() {
            this.currentView = View.TODAY;
            this.currentAreaId = null;
            this.projectTaskId = null;
            this.projectHistory = [];
            this.calendarSelectedDate = null;
            this.selectedGoal = null;
            this.selectedTask = null;
            this.currentCustomFilterId = null;
            this.searchQuery = "";
            this.advancedSearchMode = false;
            this.advancedSearchExpression = null;
            this.advancedSearchError = "";
            this.expandedTaskIds.clear();
            this.goalExpandedTaskIds.clear();
            this.bulkSelectionMode = false;
            this.selectedTaskIds.clear();
            this.settingsDialogOpen = false;
            this.settingsSection = null;
        }
    };

    return app;

}

test("mantiene la vista actual cuando el reset ocurre durante una sincronización", () => {

    const app = createApp({
        currentView: View.AREA,
        currentAreaId: "area-1",
        existingAreaIds: ["area-1"]
    });
    app.syncCheckInProgress = true;

    const controller =
        new SyncNavigationPreservationController(app);
    controller.start();

    app.resetTransientState();

    assert.equal(app.currentView, View.AREA);
    assert.equal(app.currentAreaId, "area-1");
    assert.equal(
        app.calendarSelectedDate,
        "2026-08-07"
    );

});

test("usa una vista cercana si la entidad navegada desapareció en la sincronización", () => {

    const app = createApp({
        currentView: View.AREA,
        currentAreaId: "area-eliminada"
    });
    app.autoSyncInProgress = true;

    const controller =
        new SyncNavigationPreservationController(app);
    controller.start();

    app.resetTransientState();

    assert.equal(app.currentView, View.AREAS);
    assert.equal(app.currentAreaId, null);

});

test("restaura un filtro guardado activo con la versión recibida después de sincronizar", () => {

    const app = createApp({
        currentView: View.ALL,
        filters: {
            "filter-1": {
                id: "filter-1",
                query: "priority:high"
            }
        }
    });
    app.currentCustomFilterId = "filter-1";
    app.advancedSearchMode = true;
    app.searchQuery = "priority:low";
    app.syncCheckInProgress = true;

    const controller =
        new SyncNavigationPreservationController(app);
    controller.start();

    app.resetTransientState();

    assert.equal(app.currentView, View.ALL);
    assert.equal(
        app.currentCustomFilterId,
        "filter-1"
    );
    assert.equal(app.advancedSearchMode, true);
    assert.equal(app.searchQuery, "priority:high");
    assert.ok(app.advancedSearchExpression);

});

test("un reset ajeno a sincronización conserva el comportamiento anterior", () => {

    const app = createApp({
        currentView: View.AREA,
        currentAreaId: "area-1",
        existingAreaIds: ["area-1"]
    });

    const controller =
        new SyncNavigationPreservationController(app);
    controller.start();

    app.resetTransientState();

    assert.equal(app.currentView, View.TODAY);
    assert.equal(app.currentAreaId, null);

});

test("el controlador se inicia antes de arrancar la aplicación", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );

    assert.match(
        main,
        /SyncNavigationPreservationController/
    );

    const preservationStart =
        main.indexOf(
            "syncNavigationPreservationController.start()"
        );
    const appStart = main.indexOf("app.start()");

    assert.ok(preservationStart >= 0);
    assert.ok(appStart > preservationStart);

});
