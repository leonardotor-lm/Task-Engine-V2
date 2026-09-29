import test from "node:test";
import assert from "node:assert/strict";
import { Sidebar } from "../src/ui/Sidebar.js";
import { View } from "../src/core/View.js";
import { App } from "../src/core/App.js";
import { Task } from "../src/domain/Task.js";
import { TaskSort } from "../src/core/TaskSorting.js";

function projectApp(filters = {}, sort = TaskSort.MANUAL) {
    const app = Object.create(App.prototype);
    Object.assign(app, {
        currentView: View.PROJECT,
        taskFilters: filters,
        taskSort: sort,
        searchQuery: "",
        advancedSearchMode: false,
        getTodayString: () => "2026-09-29"
    });
    return app;
}

test("el filtro rápido de proyecto conserva la subtarea coincidente y sus ancestros", () => {
    const tasks = [
        new Task({ id: "parent", title: "Etapa", priority: 0 }),
        new Task({ id: "match", title: "Urgente", parentTaskId: "parent", priority: 3 }),
        new Task({ id: "other", title: "Otra", priority: 1 })
    ];
    assert.deepEqual(
        projectApp({ priority: "3" }).filterAndSortTasksForCurrentView(tasks)
            .map(task => task.id),
        ["parent", "match"]
    );
});

test("el orden por vencimiento se aplica a las subtareas del proyecto", () => {
    const tasks = [
        new Task({ id: "later", title: "Luego", dueDate: "2026-10-05" }),
        new Task({ id: "soon", title: "Antes", dueDate: "2026-09-30" })
    ];
    assert.deepEqual(
        projectApp({}, TaskSort.DUE_DATE).filterAndSortTasksForCurrentView(tasks)
            .map(task => task.id),
        ["soon", "later"]
    );
});

test("un proyecto abierto ofrece filtros rápidos y orden", () => {

    const sidebar = new Sidebar();

    const html = sidebar.render(
        View.PROJECT,
        "",
        [],
        null,
        [],
        [],
        {},
        "MANUAL"
    );

    assert.match(
        html,
        /id="openTaskTools"/
    );
    assert.match(
        html,
        /id="taskFilterForm"/
    );
    assert.match(
        html,
        /id="taskSort"/
    );
    assert.match(
        html,
        />\s*Orden manual\s*</
    );

});
