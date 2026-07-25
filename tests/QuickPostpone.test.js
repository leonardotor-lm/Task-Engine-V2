import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

test("ofrece fechas válidas para posponer rápidamente", () => {

    const task = new Task({
        id: "dated",
        title: "Tarea fechada",
        dueDate: "2026-07-25"
    });

    const html = new TaskList().render(
        [task],
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
        "2026-07-25"
    );

    assert.match(
        html,
        /class="quickPostpone"/
    );

    assert.match(
        html,
        /data-date="2026-07-26"/
    );

    assert.match(
        html,
        /data-date="2026-08-01"/
    );

    assert.match(
        html,
        /min="2026-07-26"/
    );

});

test("calcula la posposición desde una fecha futura", () => {

    const task = new Task({
        id: "future",
        title: "Tarea futura",
        dueDate: "2026-08-10"
    });

    const html = new TaskList().render(
        [task],
        "Próximas",
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
        "2026-07-25"
    );

    assert.match(
        html,
        /data-date="2026-08-11"/
    );

    assert.match(
        html,
        /data-date="2026-08-17"/
    );

});

test("no muestra Posponer cuando la tarea no tiene fecha", () => {

    const task = new Task({
        id: "undated",
        title: "Sin fecha"
    });

    const html = new TaskList().render(
        [task],
        "Inbox"
    );

    assert.doesNotMatch(
        html,
        /class="quickPostpone"/
    );

});
