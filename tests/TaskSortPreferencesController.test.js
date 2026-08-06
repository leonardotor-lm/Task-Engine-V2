import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TaskSort } from "../src/core/TaskSorting.js";
import { View } from "../src/core/View.js";
import {
    getTaskSortViewKey,
    TaskSortPreferencesController
} from "../src/ui/TaskSortPreferencesController.js";

function createStorage() {

    const values = new Map();

    return {
        getItem(key) {
            return values.has(key)
                ? values.get(key)
                : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };

}

function createApp() {

    const app = {
        currentView: View.TODAY,
        currentAreaId: null,
        projectTaskId: null,
        selectedGoal: null,
        currentCustomFilterId: null,
        advancedSearchMode: false,
        taskSort: TaskSort.MANUAL,
        renderCount: 0,
        render() {
            this.renderCount += 1;
        },
        mainView: {
            callbacks: {}
        }
    };

    app.mainView.callbacks.onChangeTaskSort = sort => {
        app.taskSort = sort;
        app.render();
    };

    return app;

}

test("genera claves estables para vistas y espacios específicos", () => {

    assert.equal(
        getTaskSortViewKey({
            currentView: View.TODAY
        }),
        "view:today"
    );

    assert.equal(
        getTaskSortViewKey({
            currentView: View.AREA,
            currentAreaId: "area-1"
        }),
        "area:area-1"
    );

    assert.equal(
        getTaskSortViewKey({
            currentView: View.PROJECT,
            projectTaskId: "task-1"
        }),
        "project:task-1"
    );

    assert.equal(
        getTaskSortViewKey({
            currentView: View.GOAL,
            selectedGoal: { id: "goal-1" }
        }),
        "goal:goal-1"
    );

    assert.equal(
        getTaskSortViewKey({
            currentView: View.ALL,
            currentCustomFilterId: "filter-1"
        }),
        "custom-filter:filter-1"
    );

});

test("recuerda un orden independiente para cada vista", () => {

    const storage = createStorage();
    const app = createApp();
    const controller =
        new TaskSortPreferencesController(
            app,
            { storage }
        );

    controller.start();
    app.render();

    app.mainView.callbacks.onChangeTaskSort(
        TaskSort.PRIORITY
    );

    assert.equal(
        app.taskSort,
        TaskSort.PRIORITY
    );

    app.currentView = View.INBOX;
    app.render();

    assert.equal(
        app.taskSort,
        TaskSort.MANUAL
    );

    app.mainView.callbacks.onChangeTaskSort(
        TaskSort.CREATED_NEWEST
    );

    app.currentView = View.TODAY;
    app.render();

    assert.equal(
        app.taskSort,
        TaskSort.PRIORITY
    );

    app.currentView = View.INBOX;
    app.render();

    assert.equal(
        app.taskSort,
        TaskSort.CREATED_NEWEST
    );

});

test("distingue el orden de cada área", () => {

    const storage = createStorage();
    const app = createApp();

    app.currentView = View.AREA;
    app.currentAreaId = "area-1";

    const controller =
        new TaskSortPreferencesController(
            app,
            { storage }
        );

    controller.start();
    app.render();

    app.mainView.callbacks.onChangeTaskSort(
        TaskSort.DUE_DATE
    );

    app.currentAreaId = "area-2";
    app.render();

    assert.equal(
        app.taskSort,
        TaskSort.MANUAL
    );

    app.mainView.callbacks.onChangeTaskSort(
        TaskSort.PRIORITY
    );

    app.currentAreaId = "area-1";
    app.render();

    assert.equal(
        app.taskSort,
        TaskSort.DUE_DATE
    );

});

test("restaura el orden de la vista en cada render", () => {

    const storage = createStorage();
    const app = createApp();
    const controller =
        new TaskSortPreferencesController(
            app,
            { storage }
        );

    controller.start();

    app.mainView.callbacks.onChangeTaskSort(
        TaskSort.PRIORITY
    );

    app.taskSort = TaskSort.CREATED_OLDEST;
    app.render();

    assert.equal(
        app.taskSort,
        TaskSort.PRIORITY
    );

});

test("usa el orden manual ante datos dañados o valores inválidos", () => {

    const storage = createStorage();
    const app = createApp();
    const controller =
        new TaskSortPreferencesController(
            app,
            { storage }
        );

    storage.setItem(
        "task-engine-v2-task-sort-by-view-v1",
        "{dato-invalido"
    );

    assert.equal(
        controller.readSort("view:today"),
        TaskSort.MANUAL
    );

    storage.setItem(
        "task-engine-v2-task-sort-by-view-v1",
        JSON.stringify({
            "view:today": "ORDEN_INEXISTENTE"
        })
    );

    assert.equal(
        controller.readSort("view:today"),
        TaskSort.MANUAL
    );

});

test("la aplicación inicia persistencia y sincronización del orden", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );

    assert.match(
        main,
        /TaskSortPreferencesController/
    );
    assert.match(
        main,
        /taskSortPreferencesController\.start\(\)/
    );
    assert.match(
        main,
        /SyncOptionalDataBridge/
    );
    assert.match(
        main,
        /syncOptionalDataBridge\.start\(\)/
    );

});
