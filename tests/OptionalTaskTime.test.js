import assert from "node:assert/strict";
import test from "node:test";

import {
    compileAdvancedSearch,
    matchesAdvancedSearch
} from "../src/core/AdvancedSearch.js";
import { Task } from "../src/domain/Task.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";
import {
    createTaskDraft
} from "../src/ui/TaskEditorDraft.js";
import {
    compareTasks,
    TaskSort
} from "../src/core/TaskSorting.js";

test("admite una hora opcional únicamente cuando existe fecha", () => {
    const task = new Task({
        title: "Reunión",
        dueDate: "2026-08-10",
        dueTime: "18:30"
    });

    assert.equal(task.dueTime, "18:30");
    assert.equal(task.toJSON().dueTime, "18:30");

    assert.throws(
        () => new Task({
            title: "Sin fecha",
            dueTime: "18:30"
        }),
        /necesita una fecha/
    );
    assert.throws(
        () => new Task({
            title: "Hora inválida",
            dueDate: "2026-08-10",
            dueTime: "25:00"
        }),
        /hora de vencimiento es inválida/
    );
});

test("al quitar la fecha también elimina la hora", () => {
    const task = new Task({
        title: "Reunión",
        dueDate: "2026-08-10",
        dueTime: "18:30"
    });

    task.update({ dueDate: null });

    assert.equal(task.dueDate, null);
    assert.equal(task.dueTime, null);
});

test("el editor y su borrador incluyen la hora", () => {
    const task = new Task({
        title: "Reunión",
        dueDate: "2026-08-10",
        dueTime: "18:30"
    });
    const html = new TaskEditor().render(task);

    assert.match(html, /id="taskDueTime"/);
    assert.match(html, /type="time"/);
    assert.match(html, /value="18:30"/);
    assert.equal(
        createTaskDraft(task).dueTime,
        "18:30"
    );
});

test("ordena por hora cuando dos tareas vencen el mismo día", () => {
    const early = new Task({
        title: "Temprano",
        dueDate: "2026-08-10",
        dueTime: "09:00"
    });
    const late = new Task({
        title: "Tarde",
        dueDate: "2026-08-10",
        dueTime: "18:00"
    });

    assert.ok(
        compareTasks(
            early,
            late,
            TaskSort.DUE_DATE
        ) < 0
    );
});

test("la búsqueda avanzada consulta presencia y hora exacta", () => {
    const task = new Task({
        title: "Reunión",
        dueDate: "2026-08-10",
        dueTime: "18:30"
    });

    assert.equal(
        matchesAdvancedSearch(
            task,
            compileAdvancedSearch(
                "tieneHora:si AND hora:\"18:30\""
            )
        ),
        true
    );
});
