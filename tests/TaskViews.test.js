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
            id: "upcoming",
            status: TaskStatus.PENDING,
            dueDate: "2026-07-30"
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
        ["overdue", "today"]
    );

});

test("Próximas muestra tareas posteriores a hoy", () => {

    const service = createService();

    assert.deepEqual(
        getIds(service.getUpcomingTasks("2026-07-23")),
        ["upcoming"]
    );

});

test("Todas excluye tareas completadas, archivadas y eliminadas", () => {

    const service = createService();

    assert.deepEqual(
        getIds(service.getAllActiveTasks()),
        ["inbox", "overdue", "today", "upcoming"]
    );

});