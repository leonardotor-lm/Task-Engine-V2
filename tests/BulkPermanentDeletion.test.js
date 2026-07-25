import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { TaskList } from "../src/ui/TaskList.js";

function createRepository(tasks) {

    let stored = [...tasks];

    return {

        getAll() {
            return [...stored];
        },

        getById(id) {
            return stored.find(task => task.id === id) ?? null;
        },

        remove(id) {
            stored = stored.filter(task => task.id !== id);
        }

    };

}

test("elimina definitivamente una selección y sus subtareas", () => {

    const parent = new Task({
        id: "parent",
        title: "Proyecto borrado",
        status: TaskStatus.DELETED
    });

    const child = new Task({
        id: "child",
        title: "Subtarea borrada",
        status: TaskStatus.DELETED,
        parentTaskId: parent.id
    });

    const repository = createRepository([
        parent,
        child
    ]);

    const service = new TaskService(repository);
    const deleted = service.permanentlyDeleteTasks([
        parent.id
    ]);

    assert.equal(deleted.length, 2);
    assert.deepEqual(repository.getAll(), []);

});

test("no elimina definitivamente tareas que no están en la papelera", () => {

    const active = new Task({
        id: "active",
        title: "Tarea activa",
        status: TaskStatus.PENDING
    });

    const service = new TaskService(
        createRepository([active])
    );

    assert.throws(
        () => service.permanentlyDeleteTasks([
            active.id
        ]),
        /Sólo se pueden eliminar definitivamente tareas de la papelera/
    );

});

test("la selección múltiple de Papelera ofrece eliminación definitiva", () => {

    const task = new Task({
        id: "deleted",
        title: "Tarea borrada",
        status: TaskStatus.DELETED
    });

    const html = new TaskList().render(
        [task],
        "Papelera",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set([task.id]),
        true,
        "TRASH"
    );

    assert.match(
        html,
        /id="bulkPermanentlyDeleteTasks"/
    );
    assert.match(
        html,
        /Eliminar definitivamente/
    );

});
