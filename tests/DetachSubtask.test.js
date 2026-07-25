import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";

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

test("convierte una subtarea en principal y conserva su árbol", () => {

    const parent = new Task({
        id: "parent",
        title: "Proyecto original"
    });

    const child = new Task({
        id: "child",
        title: "Nuevo proyecto",
        parentTaskId: parent.id,
        areaId: "personal",
        contextId: "casa",
        tagIds: ["importante"]
    });

    const grandchild = new Task({
        id: "grandchild",
        title: "Paso interno",
        parentTaskId: child.id
    });

    const repository =
        new MemoryRepository([
            parent,
            child,
            grandchild
        ]);

    const service =
        new TaskService(repository);

    const result =
        service.detachSubtask(child.id);

    assert.equal(
        result.parentTaskId,
        null
    );

    assert.equal(
        grandchild.parentTaskId,
        child.id
    );

    assert.equal(result.areaId, "personal");
    assert.equal(result.contextId, "casa");

    assert.deepEqual(
        result.tagIds,
        ["importante"]
    );

});

test("no independiza una tarea que ya es principal", () => {

    const task = new Task({
        id: "root",
        title: "Tarea principal"
    });

    const service = new TaskService(
        new MemoryRepository([task])
    );

    assert.throws(
        () => service.detachSubtask(task.id),
        /ya es una tarea principal/
    );

});
