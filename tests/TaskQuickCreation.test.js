import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import {
    getTaskCreationDefaults
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
