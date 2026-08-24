import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { View } from "../src/core/View.js";
import {
    TaskFilterPreferencesController
} from "../src/ui/TaskFilterPreferencesController.js";
import {
    TaskFilterPreferencesRepository
} from "../src/infrastructure/TaskFilterPreferencesRepository.js";

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
        },
        removeItem(key) {
            values.delete(key);
        }
    };

}

function emptyFilters() {

    return {
        areaId: "",
        contextId: "",
        tagId: "",
        priority: "",
        due: ""
    };

}

function createApp() {

    const app = {
        currentView: View.TODAY,
        currentAreaId: null,
        selectedGoal: null,
        currentCustomFilterId: null,
        advancedSearchMode: false,
        taskFilters: emptyFilters(),
        render() {},
        mainView: {
            callbacks: {}
        }
    };

    app.mainView.callbacks.onApplyTaskFilters = filters => {
        app.taskFilters = { ...filters };
        app.render();
    };

    app.mainView.callbacks.onClearTaskFilters = () => {
        app.taskFilters = emptyFilters();
        app.render();
    };

    return app;

}

test("recuerda filtros rápidos distintos para cada vista", () => {

    const app = createApp();
    const controller =
        new TaskFilterPreferencesController(
            app,
            { storage: createStorage() }
        );

    controller.start();
    app.render();

    app.mainView.callbacks.onApplyTaskFilters({
        ...emptyFilters(),
        priority: "3",
        due: "TODAY"
    });

    app.currentView = View.INBOX;
    app.render();

    assert.deepEqual(
        app.taskFilters,
        emptyFilters()
    );

    app.mainView.callbacks.onApplyTaskFilters({
        ...emptyFilters(),
        tagId: "tag-1"
    });

    app.currentView = View.TODAY;
    app.render();

    assert.equal(app.taskFilters.priority, "3");
    assert.equal(app.taskFilters.due, "TODAY");
    assert.equal(app.taskFilters.tagId, "");

    app.currentView = View.INBOX;
    app.render();

    assert.equal(app.taskFilters.tagId, "tag-1");

});

test("distingue filtros rápidos entre áreas", () => {

    const app = createApp();
    app.currentView = View.AREA;
    app.currentAreaId = "area-1";

    const controller =
        new TaskFilterPreferencesController(
            app,
            { storage: createStorage() }
        );

    controller.start();

    app.mainView.callbacks.onApplyTaskFilters({
        ...emptyFilters(),
        contextId: "context-1"
    });

    app.currentAreaId = "area-2";
    app.render();

    assert.equal(app.taskFilters.contextId, "");

    app.mainView.callbacks.onApplyTaskFilters({
        ...emptyFilters(),
        priority: "4"
    });

    app.currentAreaId = "area-1";
    app.render();

    assert.equal(
        app.taskFilters.contextId,
        "context-1"
    );
    assert.equal(app.taskFilters.priority, "");

});

test("distingue filtros rápidos entre objetivos", () => {

    const app = createApp();
    app.currentView = View.GOAL;
    app.selectedGoal = { id: "goal-1" };

    const controller =
        new TaskFilterPreferencesController(
            app,
            { storage: createStorage() }
        );

    controller.start();

    app.mainView.callbacks.onApplyTaskFilters({
        ...emptyFilters(),
        priority: "3",
        contextId: "context-1"
    });

    app.selectedGoal = { id: "goal-2" };
    app.render();

    assert.deepEqual(
        app.taskFilters,
        emptyFilters()
    );

    app.mainView.callbacks.onApplyTaskFilters({
        ...emptyFilters(),
        due: "UPCOMING"
    });

    app.selectedGoal = { id: "goal-1" };
    app.render();

    assert.equal(app.taskFilters.priority, "3");
    assert.equal(
        app.taskFilters.contextId,
        "context-1"
    );
    assert.equal(app.taskFilters.due, "");

});

test("limpiar filtros queda persistido para esa vista", () => {

    const app = createApp();
    const controller =
        new TaskFilterPreferencesController(
            app,
            { storage: createStorage() }
        );

    controller.start();

    app.mainView.callbacks.onApplyTaskFilters({
        ...emptyFilters(),
        due: "OVERDUE"
    });

    app.mainView.callbacks.onClearTaskFilters();
    app.taskFilters.due = "UPCOMING";
    app.render();

    assert.deepEqual(
        app.taskFilters,
        emptyFilters()
    );

});

test("eliminar una etiqueta limpia su referencia en todas las vistas", () => {

    const repository =
        new TaskFilterPreferencesRepository(
            createStorage()
        );

    repository.replaceAll({
        "view:today": {
            ...emptyFilters(),
            tagId: "tag-removed"
        },
        "view:inbox": {
            ...emptyFilters(),
            tagId: "tag-kept"
        },
        "area:area-1": {
            ...emptyFilters(),
            tagId: "tag-removed"
        }
    });

    repository.clearTag("tag-removed");

    assert.equal(
        repository
            .getAll()["view:today"]
            .tagId,
        ""
    );
    assert.equal(
        repository
            .getAll()["area:area-1"]
            .tagId,
        ""
    );
    assert.equal(
        repository
            .getAll()["view:inbox"]
            .tagId,
        "tag-kept"
    );

});

test("la búsqueda avanzada no hereda filtros rápidos de la vista Todas", () => {

    const app = createApp();
    app.currentView = View.ALL;

    const controller =
        new TaskFilterPreferencesController(
            app,
            { storage: createStorage() }
        );

    controller.start();

    app.mainView.callbacks.onApplyTaskFilters({
        ...emptyFilters(),
        priority: "2"
    });

    app.advancedSearchMode = true;
    app.taskFilters = emptyFilters();
    app.render();

    assert.deepEqual(
        app.taskFilters,
        emptyFilters()
    );

});

test("main inicia persistencia y sincronización de filtros rápidos", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );

    assert.match(
        main,
        /TaskFilterPreferencesController/
    );
    assert.match(
        main,
        /taskFilterPreferencesController\.start\(\)/
    );
    assert.match(main, /TaskFilterSyncBridge/);
    assert.match(
        main,
        /taskFilterSyncBridge\.start\(\)/
    );

});
