import test from "node:test";
import assert from "node:assert/strict";

import { App } from "../src/core/App.js";
import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { View } from "../src/core/View.js";
import { TaskList } from "../src/ui/TaskList.js";

function createScenario() {

    const project = new Task({
        id: "today-project",
        title: "Proyecto de hoy",
        dueDate: "2026-08-15"
    });
    const child = new Task({
        id: "future-child",
        title: "Subtarea futura",
        parentTaskId: project.id,
        dueDate: "2026-08-20"
    });
    const grandchild = new Task({
        id: "undated-grandchild",
        title: "Subtarea sin fecha",
        parentTaskId: child.id
    });
    const completedChild = new Task({
        id: "completed-child",
        title: "Subtarea completada",
        parentTaskId: project.id
    });
    completedChild.complete();

    const tasks = [
        project,
        child,
        grandchild,
        completedChild
    ];
    const repository = {
        getAll: () => tasks
    };

    return {
        tasks,
        project,
        child,
        grandchild,
        service: new TaskService(repository)
    };

}

test("Hoy conserva las subtareas activas para poder desplegar un proyecto", () => {

    const {
        tasks,
        project,
        child,
        grandchild,
        service
    } = createScenario();
    const app = Object.create(App.prototype);

    app.currentView = View.TODAY;
    app.taskService = service;
    app.getTodayString = () => "2026-08-15";

    const visibleTasks = app.getVisibleTasks();

    assert.deepEqual(
        visibleTasks.map(task => task.id),
        [project.id, child.id, grandchild.id]
    );

    const collapsedHtml = new TaskList().render(
        visibleTasks,
        "Hoy",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(),
        false,
        "ACTIVE",
        true,
        "2026-08-15",
        tasks
    );

    assert.match(
        collapsedHtml,
        /class="toggleSubtasks"[\s\S]*?data-id="today-project"/
    );
    assert.doesNotMatch(
        collapsedHtml,
        /Subtarea futura/
    );

    const expandedHtml = new TaskList().render(
        visibleTasks,
        "Hoy",
        false,
        [],
        [],
        [],
        "",
        new Set([project.id]),
        false,
        new Set(),
        false,
        "ACTIVE",
        true,
        "2026-08-15",
        tasks
    );

    assert.match(expandedHtml, /Subtarea futura/);
    assert.match(
        expandedHtml,
        /class="toggleSubtasks"[\s\S]*?data-id="future-child"/
    );
    assert.doesNotMatch(
        expandedHtml,
        /Subtarea sin fecha/
    );

});
