import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function createService() {

    const tasks = [

        {
            id: "inbox",
            status: TaskStatus.INBOX,
            dueDate: null
        },

        {
            id: "overdue",
            status: TaskStatus.PENDING,
            dueDate: "2026-07-22"
        },

        {
            id: "today",
            status: TaskStatus.PENDING,
            dueDate: "2026-07-23"
        },

        {
            id: "tomorrow",
            status: TaskStatus.PENDING,
            dueDate: "2026-07-24"
        },

        {
            id: "upcoming-start",
            status: TaskStatus.PENDING,
            dueDate: "2026-07-25"
        },

        {
            id: "upcoming-end",
            status: TaskStatus.PENDING,
            dueDate: "2026-07-30"
        },

        {
            id: "later",
            status: TaskStatus.PENDING,
            dueDate: "2026-07-31"
        },

        {
            id: "started-overdue",
            status: TaskStatus.PENDING,
            startDate: "2026-07-20",
            dueDate: "2026-07-30"
        },

        {
            id: "starts-today",
            status: TaskStatus.PENDING,
            startDate: "2026-07-23",
            dueDate: "2026-07-30"
        },

        {
            id: "starts-tomorrow",
            status: TaskStatus.PENDING,
            startDate: "2026-07-24",
            dueDate: "2026-07-30"
        },

        {
            id: "starts-upcoming",
            status: TaskStatus.PENDING,
            startDate: "2026-07-27",
            dueDate: "2026-07-30"
        },

        {
            id: "starts-later",
            status: TaskStatus.PENDING,
            startDate: "2026-08-01",
            dueDate: "2026-08-05"
        },

        {
            id: "completed",
            status: TaskStatus.COMPLETED,
            dueDate: "2026-07-23"
        },

        {
            id: "archived",
            status: TaskStatus.ARCHIVED,
            dueDate: null
        },

        {
            id: "deleted",
            status: TaskStatus.DELETED,
            dueDate: null
        }

    ];

    const repository = {

        getAll() {

            return tasks;

        }

    };

    return new TaskService(repository);

}

function getIds(tasks) {

    return tasks.map(task => task.id);

}

test("Inbox muestra únicamente tareas con estado INBOX", () => {

    const service = createService();

    assert.deepEqual(
        getIds(service.getInboxTasks()),
        ["inbox"]
    );

});

test("Hoy muestra tareas de hoy y atrasadas", () => {

    const service = createService();

    assert.deepEqual(
        getIds(service.getTodayTasks("2026-07-23")),
        [
            "overdue",
            "today",
            "started-overdue",
            "starts-today"
        ]
    );

});

test("Mañana muestra únicamente el día siguiente", () => {

    const service = createService();

    assert.deepEqual(
        getIds(service.getTomorrowTasks("2026-07-23")),
        ["tomorrow", "starts-tomorrow"]
    );

});

test("Próximas abarca desde pasado mañana hasta siete días", () => {

    const service = createService();

    assert.deepEqual(
        getIds(service.getUpcomingTasks("2026-07-23")),
        [
            "upcoming-start",
            "upcoming-end",
            "starts-upcoming"
        ]
    );

});

test("Todas excluye tareas completadas, archivadas y eliminadas", () => {

    const service = createService();

    assert.deepEqual(
        getIds(service.getAllActiveTasks()),
        [
            "inbox",
            "overdue",
            "today",
            "tomorrow",
            "upcoming-start",
            "upcoming-end",
            "later",
            "started-overdue",
            "starts-today",
            "starts-tomorrow",
            "starts-upcoming",
            "starts-later"
        ]
    );

});

test("la fecha de inicio reemplaza al vencimiento en las vistas operativas", () => {

    const service = createService();

    assert.equal(
        getIds(service.getTodayTasks("2026-07-23"))
            .includes("starts-tomorrow"),
        false
    );
    assert.equal(
        getIds(service.getTomorrowTasks("2026-07-23"))
            .includes("starts-upcoming"),
        false
    );
    assert.equal(
        getIds(service.getUpcomingTasks("2026-07-23"))
            .includes("starts-later"),
        false
    );

});
