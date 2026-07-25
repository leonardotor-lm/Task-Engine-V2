import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";

test("una tarea archivada muestra sólo acciones de recuperación", () => {

    const task = new Task({
        id: "archived",
        title: "Proyecto archivado",
        description: "No debe mostrarse",
        status: TaskStatus.ARCHIVED
    });

    const html =
        new TaskEditor().render(task);

    assert.match(html, /<h3>Archivada<\/h3>/);
    assert.match(html, /id="restoreArchivedTask"/);
    assert.match(html, />\s*Reactivar\s*</);
    assert.match(html, /id="deleteTask"/);

    assert.doesNotMatch(html, /id="taskTitleEdit"/);
    assert.doesNotMatch(html, /id="taskDescriptionEdit"/);
    assert.doesNotMatch(html, /id="taskArea"/);
    assert.doesNotMatch(html, /No debe mostrarse/);

});

test("una tarea borrada muestra sólo restaurar y eliminar definitivamente", () => {

    const task = new Task({
        id: "deleted",
        title: "Proyecto borrado",
        description: "No debe mostrarse",
        status: TaskStatus.DELETED
    });

    const html =
        new TaskEditor().render(task);

    assert.match(html, /<h3>Papelera<\/h3>/);
    assert.match(html, /id="restoreDeletedTask"/);
    assert.match(html, /id="permanentlyDeleteTask"/);

    assert.doesNotMatch(html, /id="taskTitleEdit"/);
    assert.doesNotMatch(html, /id="taskDescriptionEdit"/);
    assert.doesNotMatch(html, /id="taskDueDate"/);
    assert.doesNotMatch(html, /No debe mostrarse/);

});
