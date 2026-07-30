import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import { TaskDisplayPreferences } from "../src/infrastructure/TaskDisplayPreferences.js";
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
