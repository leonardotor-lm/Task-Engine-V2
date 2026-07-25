import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

class MemoryRepository {

    constructor(tasks = []) {
        this.tasks = [...tasks];
    }

    getById(id) {
        return this.tasks.find(
            task => task.id === id
        ) ?? null;
    }

    getAll() {
        return [...this.tasks];
    }

    add(data) {

        const task = new Task(data);
        this.tasks.push(task);

        return task;

    }

}

test("una subtarea nueva hereda el área de su padre", () => {

    const parent = new Task({
        id: "parent-area",
        title: "Proyecto personal",
        areaId: "personal"
    });

    const service = new TaskService(
        new MemoryRepository([parent])
    );

    const child = service.createSubtask(
        parent.id,
        "Paso siguiente"
    );

    assert.equal(
        child.areaId,
        "personal"
    );

});

test("identifica una tarea padre aunque sus hijos no sean visibles", () => {

    const parent = new Task({
        id: "parent-hidden-child",
        title: "Proyecto"
    });

    const child = new Task({
        id: "hidden-child",
        title: "Paso",
        parentTaskId: parent.id
    });

    const html = new TaskList().render(
        [parent],
        "Hoy",
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
        [parent, child]
    );

    assert.match(
        html,
        /class="subtaskProgress"/
    );

    assert.match(
        html,
        /\(0\/1\)/
    );

    assert.doesNotMatch(
        html,
        /parentTaskIcon/
    );

});

test("identifica una subtarea aunque su padre no sea visible", () => {

    const parent = new Task({
        id: "hidden-parent",
        title: "Proyecto"
    });

    const child = new Task({
        id: "visible-child",
        title: "Paso visible",
        parentTaskId: parent.id
    });

    const html = new TaskList().render(
        [child],
        "Hoy",
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
        [parent, child]
    );

    assert.match(
        html,
        /class="hierarchyIcon childTaskIcon"/
    );

    assert.match(
        html,
        /title="Subtarea"/
    );

});
