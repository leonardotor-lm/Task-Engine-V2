import test from "node:test";
import assert from "node:assert/strict";

import { CalendarView } from "../src/ui/CalendarView.js";
import { Task } from "../src/domain/Task.js";

function render({ selectedDate = null, tasks = null } = {}) {
    return new CalendarView().render({
        calendarMonth: "2026-08",
        calendarSelectedDate: selectedDate,
        allTasks: tasks ?? [
            new Task({
                id: "task-1",
                title: "Reunión",
                dueDate: "2026-08-12",
                dueTime: "18:30"
            }),
            new Task({
                id: "task-2",
                title: "Sin fecha"
            }),
            new Task({
                id: "task-3",
                title: "Completada",
                dueDate: "2026-08-12",
                status: "COMPLETED"
            })
        ]
    });
}

test("muestra un mes con marcas sólo en días pendientes", () => {
    const html = render();

    assert.match(html, /agosto de 2026/i);
    assert.match(
        html,
        /data-date="2026-08-12"[\s\S]*?hasPendingTasks|hasPendingTasks[\s\S]*?data-date="2026-08-12"/
    );
    assert.match(html, /1 tarea pendiente/);
    assert.doesNotMatch(html, /calendarDayDialog/);
});

test("el modal enumera las tareas pendientes de la fecha", () => {
    const html = render({
        selectedDate: "2026-08-12"
    });

    assert.match(html, /id="calendarDayDialog"/);
    assert.match(html, /Reunión/);
    assert.match(html, /18:30/);
    assert.doesNotMatch(html, /Completada/);
    assert.match(html, /id="closeCalendarDay"/);
});

test("ofrece navegación mensual accesible", () => {
    const html = render();

    assert.match(html, /id="previousCalendarMonth"/);
    assert.match(html, /aria-label="Mes anterior"/);
    assert.match(html, /id="nextCalendarMonth"/);
    assert.match(html, /aria-label="Mes siguiente"/);
});

test("representa el período completo entre inicio y vencimiento", () => {
    const task = new Task({
        id: "period-task",
        title: "Proyecto del período",
        startDate: "2026-08-10",
        dueDate: "2026-08-12"
    });

    for (const date of [
        "2026-08-10",
        "2026-08-11",
        "2026-08-12"
    ]) {
        const html = render({
            selectedDate: date,
            tasks: [task]
        });

        assert.match(html, /Proyecto del período/);
        assert.match(html, /1 tarea pendiente/);
    }
});

test("ubica una tarea con sólo fecha de inicio en ese día", () => {
    const html = render({
        selectedDate: "2026-08-15",
        tasks: [new Task({
            id: "start-only",
            title: "Comenzar investigación",
            startDate: "2026-08-15"
        })]
    });

    assert.match(html, /Comenzar investigación/);
    assert.match(html, /1 tarea pendiente/);
});

test("mantiene las tareas en espera fuera del calendario", () => {
    const html = render({
        selectedDate: "2026-08-12",
        tasks: [new Task({
            id: "waiting-task",
            title: "Esperar presupuesto",
            startDate: "2026-08-10",
            dueDate: "2026-08-12",
            isWaiting: true
        })]
    });

    assert.doesNotMatch(html, /Esperar presupuesto/);
    assert.doesNotMatch(html, /hasPendingTasks/);
});

test("no duplica una tarea cuando inicio y vencimiento coinciden", () => {
    const html = render({
        selectedDate: "2026-08-18",
        tasks: [new Task({
            id: "same-day-task",
            title: "Entrega en el día",
            startDate: "2026-08-18",
            dueDate: "2026-08-18"
        })]
    });

    assert.match(html, /1 tarea pendiente/);
    assert.doesNotMatch(html, /2 tareas pendientes/);
    assert.equal(
        html.match(/<strong>Entrega en el día<\/strong>/g)?.length,
        1
    );
});
