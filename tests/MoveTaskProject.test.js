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

test("el selector excluye el destino circular", () => {

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

    assert.match(
        html,
        /value="destination-ui"/
    );

    const parentRow = html.slice(
        html.indexOf('data-id="parent-ui"'),
        html.indexOf('data-id="destination-ui"')
    );

    assert.doesNotMatch(
        parentRow,
        /value="child-ui"/
    );

});
