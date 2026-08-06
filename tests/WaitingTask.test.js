import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { View } from "../src/core/View.js";
import {
    getTaskCreationDefaults,
    getTaskCreationView
} from "../src/core/TaskCreationDefaults.js";
import {
    compileAttachmentSearch,
    matchesAttachmentSearch
} from "../src/core/AttachmentSearch.js";

test("persiste la marca de tarea en espera", () => {

    const task = new Task({
        title: "Esperar presupuesto",
        isWaiting: true
    });

    assert.equal(task.isWaiting, true);
    assert.equal(task.toJSON().isWaiting, true);

    const restored = new Task(task.toJSON());
    assert.equal(restored.isWaiting, true);

});

test("limpia la espera al completar, archivar o eliminar", () => {

    const completed = new Task({
        title: "Completar",
        isWaiting: true
    });
    completed.complete();
    assert.equal(completed.isWaiting, false);

    const archived = new Task({
        title: "Archivar",
        isWaiting: true
    });
    archived.archive();
    assert.equal(archived.isWaiting, false);

    const deleted = new Task({
        title: "Eliminar",
        isWaiting: true
    });
    deleted.delete();
    assert.equal(deleted.isWaiting, false);

});

test("sólo permite espera en tareas incompletas", () => {

    const completed = new Task({
        title: "Terminada",
        status: TaskStatus.COMPLETED,
        isWaiting: true
    });

    assert.equal(completed.isWaiting, false);

    assert.throws(
        () => completed.update({
            isWaiting: true
        }),
        /Sólo una tarea incompleta/
    );

});

test("crea tareas en espera desde su vista", () => {

    assert.deepEqual(
        getTaskCreationDefaults(
            View.WAITING,
            "2026-08-05"
        ),
        { isWaiting: true }
    );

    assert.equal(
        getTaskCreationView(View.WAITING),
        View.WAITING
    );

});

test("busca por enEspera y permite combinar criterios", () => {

    const expression = compileAttachmentSearch(
        "enEspera:si AND titulo:presupuesto"
    ).expression;

    assert.equal(
        matchesAttachmentSearch(
            {
                title: "Esperar presupuesto",
                isWaiting: true,
                attachments: []
            },
            expression
        ),
        true
    );

    assert.equal(
        matchesAttachmentSearch(
            {
                title: "Esperar presupuesto",
                isWaiting: false,
                attachments: []
            },
            expression
        ),
        false
    );

});

test("acepta el alias isWaiting", () => {

    const expression = compileAttachmentSearch(
        "isWaiting:false"
    ).expression;

    assert.equal(
        matchesAttachmentSearch(
            {
                isWaiting: false,
                attachments: []
            },
            expression
        ),
        true
    );

});
