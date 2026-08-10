import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";

test("no reserva espacio cuando no hay una tarea abierta", () => {

    const html = new TaskEditor().render(
        null
    );

    assert.equal(html, "");

});

test("renderiza la tarea dentro de un panel cerrable", () => {

    const task = new Task({
        id: "drawer-task",
        title: "Editar en panel"
    });

    const html = new TaskEditor().render(
        task
    );

    assert.match(
        html,
        /class="details taskDrawer"/
    );

    assert.match(
        html,
        /id="closeTaskEditor"/
    );

    assert.match(
        html,
        /aria-label="Cerrar editor"/
    );

    assert.match(
        html,
        /value="Editar en panel"/
    );

});

test("el editor permite definir una fecha de inicio", () => {

    const task = new Task({
        title: "Preparar clase",
        startDate: "2026-08-10",
        dueDate: "2026-08-12"
    });

    const html = new TaskEditor().render(task);

    assert.match(html, /for="taskStartDate"/);
    assert.match(
        html,
        /id="taskStartDate"[\s\S]*value="2026-08-10"/
    );

});
