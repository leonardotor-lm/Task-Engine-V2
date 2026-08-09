import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

class MemoryRepository {

    constructor(tasks) {
        this.tasks = tasks;
    }

    getById(id) {
        return this.tasks.find(
            task => task.id === id
        ) ?? null;
    }

    getAll() {
        return [...this.tasks];
    }

    update(task) {

        const index = this.tasks.findIndex(
            item => item.id === task.id
        );

        this.tasks[index] = task;

    }

}

test("mueve una tarea y conserva todo su árbol", () => {

    const destination = new Task({
        id: "destination",
        title: "Proyecto destino"
    });

    const task = new Task({
        id: "moving",
        title: "Bloque a mover",
        areaId: "personal"
    });

    const child = new Task({
        id: "child",
        title: "Paso interno",
        parentTaskId: task.id
    });

    const repository =
        new MemoryRepository([
            destination,
            task,
            child
        ]);

    const service =
        new TaskService(repository);

    const result =
        service.moveTaskToProject(
            task.id,
            destination.id
        );

    assert.equal(
        result.parentTaskId,
        destination.id
    );

    assert.equal(
        child.parentTaskId,
        task.id
    );

    assert.equal(
        result.areaId,
        "personal"
    );

});

test("impide mover una tarea dentro de un descendiente", () => {

    const parent = new Task({
        id: "parent",
        title: "Proyecto"
    });

    const child = new Task({
        id: "child",
        title: "Subproyecto",
        parentTaskId: parent.id
    });

    const service = new TaskService(
        new MemoryRepository([
            parent,
            child
        ])
    );

    assert.throws(
        () => service.moveTaskToProject(
            parent.id,
            child.id
        ),
        /descendientes/
    );

});

test("mueve varias tareas conservando sus árboles", () => {

    const destination = new Task({
        id: "bulk-destination",
        title: "Proyecto destino"
    });
    const first = new Task({
        id: "bulk-first",
        title: "Primera"
    });
    const second = new Task({
        id: "bulk-second",
        title: "Segunda"
    });
    const child = new Task({
        id: "bulk-child",
        title: "Paso interno",
        parentTaskId: first.id
    });
    const repository = new MemoryRepository([
        destination,
        first,
        second,
        child
    ]);
    const service = new TaskService(repository);

    const moved = service.moveTasks(
        [first.id, second.id],
        destination.id
    );

    assert.equal(moved.length, 2);
    assert.equal(first.parentTaskId, destination.id);
    assert.equal(second.parentTaskId, destination.id);
    assert.equal(child.parentTaskId, first.id);

});

test("mover una selección con padre e hija no rompe su jerarquía", () => {

    const destination = new Task({
        id: "tree-destination",
        title: "Destino"
    });
    const parent = new Task({
        id: "tree-parent",
        title: "Padre"
    });
    const child = new Task({
        id: "tree-child",
        title: "Hija",
        parentTaskId: parent.id
    });
    const service = new TaskService(
        new MemoryRepository([
            destination,
            parent,
            child
        ])
    );

    service.moveTasks(
        [parent.id, child.id],
        destination.id
    );

    assert.equal(parent.parentTaskId, destination.id);
    assert.equal(child.parentTaskId, parent.id);

});

test("impide mover una selección dentro de sus descendientes", () => {

    const parent = new Task({
        id: "bulk-parent",
        title: "Proyecto"
    });
    const child = new Task({
        id: "bulk-descendant",
        title: "Descendiente",
        parentTaskId: parent.id
    });
    const service = new TaskService(
        new MemoryRepository([parent, child])
    );

    assert.throws(
        () => service.moveTasks(
            [parent.id],
            child.id
        ),
        /descendientes/
    );

});

test("la lista reserva el selector de movimiento para el editor", () => {

    const parent = new Task({
        id: "parent-ui",
        title: "Proyecto"
    });

    const child = new Task({
        id: "child-ui",
        title: "Hija",
        parentTaskId: parent.id
    });

    const destination = new Task({
        id: "destination-ui",
        title: "Destino válido"
    });

    const html = new TaskList().render(
        [parent, destination],
        "Todas",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(),
        false,
        "ACTIVE",
        true,
        "2026-07-25",
        [
            parent,
            child,
            destination
        ]
    );

    assert.doesNotMatch(
        html,
        /class="quickMoveTarget"/
    );

    assert.doesNotMatch(
        html,
        /class="quickMoveTask"/
    );

});
