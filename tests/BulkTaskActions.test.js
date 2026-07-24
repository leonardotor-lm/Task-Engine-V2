import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { TaskService } from "../src/core/TaskService.js";

class MemoryRepository {

    constructor(tasks) {
        this.tasks = [...tasks];
        this.writes = 0;
    }

    getAll() {
        return [...this.tasks];
    }

    getById(id) {
        return this.tasks.find(
            task => task.id === id
        ) ?? null;
    }

    updateMany(tasks) {

        const replacements = new Map(
            tasks.map(task => [task.id, task])
        );

        this.tasks = this.tasks.map(
            task =>
                replacements.get(task.id) ??
                task
        );

        this.writes += 1;

    }

    replaceAll(tasks) {
        this.tasks = [...tasks];
        this.writes += 1;
    }

}

function tree() {

    const parent = new Task({
        id: "parent",
        title: "Principal"
    });

    const child = new Task({
        id: "child",
        title: "Subtarea",
        parentTaskId: parent.id
    });

    return {
        parent,
        child,
        repository:
            new MemoryRepository([
                parent,
                child
            ])
    };

}

test("completa un árbol seleccionado con una sola escritura", () => {

    const {
        parent,
        child,
        repository
    } = tree();

    const service =
        new TaskService(repository);

    service.completeTasks([
        parent.id,
        child.id
    ]);

    assert.ok(
        repository.getAll().every(
            task => task.isCompleted()
        )
    );

    assert.equal(repository.writes, 1);

});

test("no completa parcialmente una tarea principal", () => {

    const {
        parent,
        repository
    } = tree();

    const service =
        new TaskService(repository);

    assert.throws(
        () => service.completeTasks([
            parent.id
        ]),
        /subtareas activas/
    );

    assert.ok(
        repository.getAll().every(
            task =>
                task.status ===
                TaskStatus.INBOX
        )
    );

    assert.equal(repository.writes, 0);

});

test("archiva un árbol cuando está seleccionado completo", () => {

    const {
        parent,
        child,
        repository
    } = tree();

    const service =
        new TaskService(repository);

    service.archiveTasks([
        parent.id,
        child.id
    ]);

    assert.ok(
        repository.getAll().every(
            task => task.isArchived()
        )
    );

    assert.equal(repository.writes, 1);

});

test("envía a papelera todo el árbol aunque sólo se seleccione la raíz", () => {

    const {
        parent,
        repository
    } = tree();

    const service =
        new TaskService(repository);

    const deleted =
        service.deleteTasks([
            parent.id
        ]);

    assert.equal(deleted.length, 2);

    assert.ok(
        repository.getAll().every(
            task => task.isDeleted()
        )
    );

    assert.equal(repository.writes, 1);

});

test("completar una recurrente genera la siguiente instancia", () => {

    const recurring = new Task({
        id: "recurring",
        title: "Revisar agenda",
        dueDate: "2026-07-24",
        recurrence: "DAILY"
    });

    const repository =
        new MemoryRepository([recurring]);

    const service =
        new TaskService(repository);

    service.completeTasks([
        recurring.id
    ]);

    const tasks = repository.getAll();

    assert.equal(tasks.length, 2);
    assert.equal(
        tasks[0].status,
        TaskStatus.COMPLETED
    );
    assert.equal(
        tasks[1].dueDate,
        "2026-07-25"
    );

});
