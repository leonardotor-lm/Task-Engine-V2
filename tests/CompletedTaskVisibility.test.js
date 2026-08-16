import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import {
    filterCompletedTasks
} from "../src/core/TaskFilters.js";
import { Goal } from "../src/domain/Goal.js";
import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { TaskDisplayPreferences } from "../src/infrastructure/TaskDisplayPreferences.js";
import { GoalView } from "../src/ui/GoalView.js";
import { Sidebar } from "../src/ui/Sidebar.js";

class MemoryStorage {

    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.get(key) ?? null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }

}

test("las tareas completadas permanecen ocultas por defecto", () => {

    const preferences =
        new TaskDisplayPreferences(
            new MemoryStorage()
        );

    assert.equal(
        preferences.areCompletedTasksVisible(),
        false
    );

});

test("recuerda la preferencia de mostrar tareas completadas", () => {

    const storage = new MemoryStorage();
    const preferences =
        new TaskDisplayPreferences(storage);

    assert.equal(
        preferences.toggleCompletedTasks(),
        true
    );

    const restoredPreferences =
        new TaskDisplayPreferences(storage);

    assert.equal(
        restoredPreferences.areCompletedTasksVisible(),
        true
    );

    assert.equal(
        restoredPreferences.toggleCompletedTasks(),
        false
    );

});

test("muestra el control en las vistas activas y proyectos", () => {

    const sidebar = new Sidebar();

    for (const view of [
        View.INBOX,
        View.TODAY,
        View.UPCOMING,
        View.ALL,
        View.AREA,
        View.PROJECT
    ]) {

        const html = sidebar.render(
            view
        );

        assert.match(
            html,
            /id="toggleCompletedTasks"/
        );

        assert.match(
            html,
            /Mostrar completadas/
        );

    }

});

test("oculta el control en completadas, archivadas y papelera", () => {

    const sidebar = new Sidebar();

    for (const view of [
        View.COMPLETED,
        View.ARCHIVED,
        View.TRASH
    ]) {

        assert.doesNotMatch(
            sidebar.render(view),
            /id="toggleCompletedTasks"/
        );

    }

});

test("indica visualmente cuando se muestran las completadas", () => {

    const sidebar = new Sidebar();

    const html = sidebar.render(
        View.TODAY,
        "",
        [],
        null,
        [],
        [],
        {},
        "MANUAL",
        false,
        false,
        "",
        0,
        false,
        "",
        null,
        false,
        false,
        false,
        null,
        true
    );

    assert.match(
        html,
        /Ocultar completadas/
    );

    assert.match(
        html,
        /taskToolsButton active/
    );

});

test("filtra completadas en espacios de trabajo sin mutar la lista", () => {

    const active = new Task({
        id: "active",
        title: "Pendiente"
    });
    const completed = new Task({
        id: "completed",
        title: "Terminada",
        status: TaskStatus.COMPLETED
    });
    const tasks = [active, completed];

    assert.deepEqual(
        filterCompletedTasks(tasks),
        [active]
    );
    assert.deepEqual(
        filterCompletedTasks(tasks, true),
        tasks
    );
    assert.equal(tasks.length, 2);

});

test("Objetivos muestra el control y conserva el progreso total", () => {

    const goal = new Goal({
        id: "goal",
        title: "Publicar libro"
    });
    const active = new Task({
        id: "active",
        title: "Corregir manuscrito",
        goalIds: [goal.id]
    });
    const completed = new Task({
        id: "completed",
        title: "Escribir borrador",
        status: TaskStatus.COMPLETED,
        goalIds: [goal.id]
    });
    const view = new GoalView();
    const baseState = {
        selectedGoal: goal,
        tasks: [active],
        goalWorkspaceTasks: [active, completed],
        allTasks: [active, completed],
        goals: [goal],
        areas: [],
        contexts: [],
        tags: [],
        goalExpandedTaskIds: new Set(),
        showTaskMetadata: true,
        today: "2026-08-16",
        inlineSubtaskParentId: null
    };

    const hiddenHtml = view.render({
        ...baseState,
        showCompletedTasks: false
    });

    assert.match(
        hiddenHtml,
        /id="toggleCompletedTasks"/
    );
    assert.match(
        hiddenHtml,
        /aria-pressed="false"/
    );
    assert.match(hiddenHtml, /Mostrar completadas/);
    assert.match(hiddenHtml, /Tareas 1\/2/);
    assert.doesNotMatch(hiddenHtml, /Escribir borrador/);

    const visibleHtml = view.render({
        ...baseState,
        tasks: [active, completed],
        showCompletedTasks: true
    });

    assert.match(
        visibleHtml,
        /aria-pressed="true"/
    );
    assert.match(visibleHtml, /Ocultar completadas/);
    assert.match(visibleHtml, /Escribir borrador/);

});
