import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import {
    getPostCreationView,
    getTaskCreationDefaults,
    getTaskCreationView
} from "../src/core/TaskCreationDefaults.js";
import { Sidebar } from "../src/ui/Sidebar.js";
import { TaskList } from "../src/ui/TaskList.js";

test("crear desde Hoy hereda la fecha actual", () => {

    assert.deepEqual(
        getTaskCreationDefaults(
            View.TODAY,
            "2026-07-25"
        ),
        {
            dueDate: "2026-07-25"
        }
    );

});

test("crear desde Mañana hereda el día siguiente", () => {

    assert.deepEqual(
        getTaskCreationDefaults(
            View.TOMORROW,
            "2026-07-31"
        ),
        { dueDate: "2026-08-01" }
    );

    assert.equal(
        getTaskCreationView(View.TOMORROW),
        View.TOMORROW
    );

});

test("crear desde Inbox no fuerza propiedades", () => {

    assert.deepEqual(
        getTaskCreationDefaults(
            View.INBOX,
            "2026-07-25"
        ),
        {}
    );

});

test("la barra lateral ofrece Nueva tarea", () => {

    const html = new Sidebar().render(
        View.TODAY
    );

    assert.match(
        html,
        /id="openTaskCreation"/
    );

    assert.match(
        html,
        /Nueva tarea/
    );

    assert.match(
        html,
        /class="newTaskButton createActionButton"/
    );

    assert.match(
        html,
        /class="createActionIcon"/
    );

});

test("la captura rápida puede cancelarse", () => {

    const html = new TaskList().render(
        [],
        "Hoy y atrasadas",
        true
    );

    assert.match(
        html,
        /id="taskForm"/
    );

    assert.match(
        html,
        /id="cancelTaskCreation"/
    );

    assert.match(
        html,
        /autofocus/
    );

});

test("crear desde una vista administrativa comienza en Inbox", () => {

    assert.equal(
        getTaskCreationView(View.AREAS),
        View.INBOX
    );

    assert.equal(
        getTaskCreationView(View.CONTEXTS),
        View.INBOX
    );

    assert.equal(
        getTaskCreationView(View.TAGS),
        View.INBOX
    );

});

test("una tarea sin fecha creada en Próximas pasa a Inbox", () => {

    assert.equal(
        getPostCreationView(
            View.UPCOMING,
            { dueDate: null }
        ),
        View.INBOX
    );

});

test("una tarea fechada permanece en Próximas", () => {

    assert.equal(
        getPostCreationView(
            View.UPCOMING,
            { dueDate: "2026-07-26" }
        ),
        View.UPCOMING
    );

});
