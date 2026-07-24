import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function createFixture({
    parentStatus = TaskStatus.PENDING,
    childStatus = TaskStatus.PENDING,
    grandchildStatus = TaskStatus.PENDING
} = {}) {

    let tasks = [
        new Task({
            id: "parent",
            title: "Tarea principal",
            status: parentStatus
        }),
        new Task({
            id: "child",
            title: "Subtarea",
            status: childStatus,
            parentTaskId: "parent"
        }),
        new Task({
            id: "grandchild",
            title: "Subtarea anidada",
            status: grandchildStatus,
            parentTaskId: "child"
        })
    ];

    const repository = {

        getAll() {

            return [...tasks];

        },

        getById(id) {

            return tasks.find(task => task.id === id) ?? null;

        },

        update(task) {

            const index = tasks.findIndex(item => item.id === task.id);

            tasks[index] = task;

        },

        remove(id) {

            tasks = tasks.filter(task => task.id !== id);

        }

    };

    return {
        service: new TaskService(repository),

        getTasks() {

            return [...tasks];

        }
    };

}

test("no completa una tarea con descendientes activos", () => {

    const fixture = createFixture();

    assert.throws(
        () => fixture.service.toggleTask("parent"),
        {
            message: "Completá primero las subtareas pendientes."
        }
    );

});

test("completa la tarea padre cuando todos sus descendientes están completados", () => {

    const fixture = createFixture({
        childStatus: TaskStatus.COMPLETED,
        grandchildStatus: TaskStatus.COMPLETED
    });

    fixture.service.toggleTask("parent");

    assert.equal(
        fixture.service.getTaskById("parent").status,
        TaskStatus.COMPLETED
    );

});

test("no archiva una tarea con descendientes activos", () => {

    const fixture = createFixture();

    assert.throws(
        () => fixture.service.archiveTask("parent"),
        {
            message: "No se puede archivar una tarea con subtareas activas."
        }
    );

});

test("mueve a la papelera todo el árbol", () => {

    const fixture = createFixture();

    fixture.service.deleteTask("parent");

    assert.ok(
        fixture.getTasks().every(
            task => task.status === TaskStatus.DELETED
        )
    );

});

test("restaura todo el árbol conservando sus estados anteriores", () => {

    const fixture = createFixture({
        parentStatus: TaskStatus.PENDING,
        childStatus: TaskStatus.COMPLETED,
        grandchildStatus: TaskStatus.INBOX
    });

    fixture.service.deleteTask("parent");
    fixture.service.restoreDeletedTask("parent");

    const statuses = Object.fromEntries(
        fixture.getTasks().map(task => [
            task.id,
            task.status
        ])
    );

    assert.deepEqual(statuses, {
        parent: TaskStatus.PENDING,
        child: TaskStatus.COMPLETED,
        grandchild: TaskStatus.INBOX
    });

});

test("elimina definitivamente todo el árbol", () => {

    const fixture = createFixture();

    fixture.service.deleteTask("parent");
    fixture.service.permanentlyDeleteTask("parent");

    assert.deepEqual(fixture.getTasks(), []);

});

test("encuentra descendientes de todos los niveles", () => {

    const fixture = createFixture();

    assert.deepEqual(
        fixture.service
            .getDescendants("parent")
            .map(task => task.id),
        ["child", "grandchild"]
    );

});
