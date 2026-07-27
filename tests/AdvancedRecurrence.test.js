import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import {
    RecurrenceFrequency,
    RecurrenceWeekday,
    getNextRecurrenceDate,
    normalizeRecurrenceRule
} from "../src/domain/Recurrence.js";

test("mantiene el comportamiento diario anterior", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-27",
            RecurrenceFrequency.DAILY
        ),
        "2026-07-28"
    );

});

test("admite intervalos diarios y semanales", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-27",
            RecurrenceFrequency.DAILY,
            { interval: 3 }
        ),
        "2026-07-30"
    );

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-27",
            RecurrenceFrequency.WEEKLY,
            { interval: 2 }
        ),
        "2026-08-10"
    );

});

test("recorre varios días elegidos de una semana", () => {

    const weekdays = [
        RecurrenceWeekday.MONDAY,
        RecurrenceWeekday.WEDNESDAY,
        RecurrenceWeekday.FRIDAY
    ];

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-27",
            RecurrenceFrequency.WEEKLY,
            { weekdays }
        ),
        "2026-07-29"
    );

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-31",
            RecurrenceFrequency.WEEKLY,
            { weekdays }
        ),
        "2026-08-03"
    );

});

test("combina días específicos con semanas alternadas", () => {

    const weekdays = [
        RecurrenceWeekday.MONDAY,
        RecurrenceWeekday.WEDNESDAY
    ];

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-27",
            RecurrenceFrequency.WEEKLY,
            {
                interval: 2,
                weekdays
            }
        ),
        "2026-07-29"
    );

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-29",
            RecurrenceFrequency.WEEKLY,
            {
                interval: 2,
                weekdays
            }
        ),
        "2026-08-10"
    );

});

test("conserva el día posible en intervalos mensuales", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-01-31",
            RecurrenceFrequency.MONTHLY
        ),
        "2026-02-28"
    );

    assert.equal(
        getNextRecurrenceDate(
            "2026-01-31",
            RecurrenceFrequency.MONTHLY,
            { interval: 2 }
        ),
        "2026-03-31"
    );

});

test("valida intervalos y días específicos", () => {

    assert.throws(
        () =>
            normalizeRecurrenceRule(
                RecurrenceFrequency.DAILY,
                { interval: 0 }
            ),
        /intervalo/
    );

    assert.throws(
        () =>
            normalizeRecurrenceRule(
                RecurrenceFrequency.MONTHLY,
                {
                    weekdays: [
                        RecurrenceWeekday.MONDAY
                    ]
                }
            ),
        /semanal/
    );

});

test("las tareas antiguas reciben una regla compatible", () => {

    const task = new Task({
        title: "Revisión",
        dueDate: "2026-07-27",
        recurrence:
            RecurrenceFrequency.WEEKLY
    });

    assert.equal(
        task.recurrenceInterval,
        1
    );

    assert.deepEqual(
        task.recurrenceWeekdays,
        []
    );

    assert.deepEqual(
        new Task(
            task.toJSON()
        ).recurrenceWeekdays,
        []
    );

});

test("una tarea conserva su regla avanzada", () => {

    const task = new Task({
        title: "Entrenamiento",
        dueDate: "2026-07-27",
        recurrence:
            RecurrenceFrequency.WEEKLY,
        recurrenceInterval: 2,
        recurrenceWeekdays: [
            RecurrenceWeekday.WEDNESDAY,
            RecurrenceWeekday.MONDAY
        ]
    });

    assert.deepEqual(
        task.toJSON().recurrenceWeekdays,
        [
            RecurrenceWeekday.MONDAY,
            RecurrenceWeekday.WEDNESDAY
        ]
    );

    assert.equal(
        task.recurrenceInterval,
        2
    );

});
