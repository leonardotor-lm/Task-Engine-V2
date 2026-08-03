import test from "node:test";
import assert from "node:assert/strict";

import { CalendarView } from "../src/ui/CalendarView.js";
import { Task } from "../src/domain/Task.js";

function render({ selectedDate = null } = {}) {
    return new CalendarView().render({
        calendarMonth: "2026-08",
        calendarSelectedDate: selectedDate,
        allTasks: [
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
