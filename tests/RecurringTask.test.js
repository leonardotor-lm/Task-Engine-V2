import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { RecurrenceFrequency } from "../src/domain/Recurrence.js";

function createFixture(taskData = {}) {

    let tasks = [
        new Task({
            id: "task-1",
            title: "Revisar planificación",
            status: TaskStatus.PENDING,
            dueDate: "2026-07-24",
            ...taskData
        })
    ];

    const repository = {

        getAll() {

            return [...tasks];

        },

        getById(id) {

            return tasks.find(task => task.id === id) ?? null;

        },

        add(data) {

            const task = new Task(data);

            tasks.push(task);

            return task;

        },

        update(task) {

            const index = tasks.findIndex(
                item => item.id === task.id
            );

            tasks[index] = task;

        }

    };

    return {
        service: new TaskService(repository),

        getTasks() {

            return [...tasks];

        }
    };

}

test("genera la siguiente instancia al completar una tarea diaria", () => {

    const fixture = createFixture({
        recurrence: RecurrenceFrequency.DAILY,
        recurrenceId: "series-1"
    });

    fixture.service.toggleTask("task-1");

    const tasks = fixture.getTasks();

    assert.equal(tasks.length, 2);
    assert.equal(tasks[0].status, TaskStatus.COMPLETED);
    assert.equal(tasks[1].status, TaskStatus.PENDING);
    assert.equal(tasks[1].dueDate, "2026-07-25");
    assert.equal(tasks[1].recurrenceId, "series-1");
    assert.equal(
        tasks[1].recurrence,
        RecurrenceFrequency.DAILY
    );

});

test("copia la clasificación en la siguiente instancia", () => {

    const fixture = createFixture({
        description: "Control semanal",
        areaId: "area-1",
        contextId: "context-1",
        priority: 3,
        tagIds: ["tag-1"],
        recurrence: RecurrenceFrequency.WEEKLY,
        recurrenceId: "series-1"
    });

    fixture.service.toggleTask("task-1");

    const nextTask = fixture.getTasks()[1];

    assert.equal(nextTask.description, "Control semanal");
    assert.equal(nextTask.areaId, "area-1");
    assert.equal(nextTask.contextId, "context-1");
    assert.equal(nextTask.priority, 3);
    assert.deepEqual(nextTask.tagIds, ["tag-1"]);
    assert.equal(nextTask.dueDate, "2026-07-31");

});

test("no permite recurrencia sin fecha de vencimiento", () => {

    const task = new Task({
        title: "Tarea sin fecha"
    });

    assert.throws(
        () => task.update({
            recurrence: RecurrenceFrequency.DAILY
        }),
        {
            message: "La recurrencia necesita una fecha de vencimiento."
        }
    );

});

test("no permite recurrencia en una tarea con subtareas", () => {

    const fixture = createFixture();

    fixture.service.createSubtask(
        "task-1",
        "Subtarea"
    );

    assert.throws(
        () => fixture.service.updateTask(
            "task-1",
            {
                recurrence: RecurrenceFrequency.DAILY
            }
        ),
        {
            message: "La recurrencia sólo puede aplicarse a tareas sin subtareas."
        }
    );

});

test("no permite agregar subtareas a una tarea recurrente", () => {

    const fixture = createFixture({
        recurrence: RecurrenceFrequency.DAILY
    });

    assert.throws(
        () => fixture.service.createSubtask(
            "task-1",
            "Subtarea"
        ),
        {
            message: "No se pueden agregar subtareas a una tarea recurrente."
        }
    );

});

test("permite finalizar una recurrencia desde el editor", () => {

    const fixture = createFixture({
        recurrence: RecurrenceFrequency.MONTHLY,
        recurrenceId: "series-1"
    });

    const task = fixture.service.updateTask(
        "task-1",
        {
            recurrence: null
        }
    );

    assert.equal(task.recurrence, null);
    assert.equal(task.recurrenceId, null);

});

test("no reabre una instancia recurrente ya completada", () => {

    const fixture = createFixture({
        recurrence: RecurrenceFrequency.DAILY,
        recurrenceId: "series-1"
    });

    fixture.service.toggleTask("task-1");

    assert.throws(
        () => fixture.service.toggleTask("task-1"),
        {
            message: "No se puede reabrir una instancia recurrente completada. Editá la siguiente instancia."
        }
    );

});
