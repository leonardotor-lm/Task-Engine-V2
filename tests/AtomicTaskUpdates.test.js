import test from "node:test";
import assert from "node:assert/strict";
import { Task } from "../src/domain/Task.js";
import {
    applyAtomicTaskUpdates
} from "../src/core/AtomicTaskUpdates.js";

function createRepository(tasks, { failUpdateMany = false } = {}) {
    return {
        tasks,
        getAll() {
            return [...this.tasks];
        },
        getById(id) {
            return this.tasks.find(task => task.id === id) ?? null;
        },
        updateMany(nextTasks) {
            const replacements = new Map(
                nextTasks.map(task => [task.id, task])
            );
            this.tasks = this.tasks.map(task =>
                replacements.get(task.id) ?? task
            );
            if (failUpdateMany) {
                throw new Error("fallo simulado de persistencia");
            }
        },
        replaceAll(nextTasks) {
            this.tasks = [...nextTasks];
        }
    };
}

function createTaskService(repository) {
    return {
        repository,
        activityService: {
            events: [],
            describeChanges() {
                return "Cambio";
            },
            recordTask(type, task, details) {
                this.events.push({ type, taskId: task.id, details });
            }
        }
    };
}

test("aplica todas las actualizaciones en una sola operación", () => {
    const first = new Task({
        id: "a",
        title: "Primera",
        areaId: "area",
        status: "PENDING",
        priority: 0
    });
    const second = new Task({
        id: "b",
        title: "Segunda",
        areaId: "area",
        status: "PENDING",
        priority: 1
    });
    const repository = createRepository([first, second]);
    const service = createTaskService(repository);

    const updated = applyAtomicTaskUpdates(service, [
        { id: "a", changes: { priority: 3 } },
        { id: "b", changes: { priority: 4 } }
    ]);

    assert.equal(updated.length, 2);
    assert.equal(repository.getById("a").priority, 3);
    assert.equal(repository.getById("b").priority, 4);
    assert.equal(service.activityService.events.length, 2);
});

test("no modifica ninguna tarea si una actualización es inválida", () => {
    const first = new Task({
        id: "a",
        title: "Primera",
        areaId: "area",
        status: "PENDING",
        priority: 0
    });
    const second = new Task({
        id: "b",
        title: "Segunda",
        areaId: "area",
        status: "PENDING",
        startDate: "2026-08-25"
    });
    const repository = createRepository([first, second]);
    const service = createTaskService(repository);

    assert.throws(
        () => applyAtomicTaskUpdates(service, [
            { id: "a", changes: { priority: 4 } },
            { id: "b", changes: { dueDate: "2026-08-20" } }
        ]),
        /fecha de inicio/i
    );

    assert.equal(repository.getById("a").priority, 0);
    assert.equal(repository.getById("b").dueDate, null);
    assert.equal(service.activityService.events.length, 0);
});

test("restaura el lote si falla la persistencia", () => {
    const first = new Task({
        id: "a",
        title: "Primera",
        areaId: "area",
        status: "PENDING",
        priority: 0
    });
    const second = new Task({
        id: "b",
        title: "Segunda",
        areaId: "area",
        status: "PENDING",
        priority: 1
    });
    const repository = createRepository(
        [first, second],
        { failUpdateMany: true }
    );
    const service = createTaskService(repository);

    assert.throws(
        () => applyAtomicTaskUpdates(service, [
            { id: "a", changes: { priority: 3 } },
            { id: "b", changes: { priority: 4 } }
        ]),
        /fallo simulado/
    );

    assert.equal(repository.getById("a").priority, 0);
    assert.equal(repository.getById("b").priority, 1);
    assert.equal(service.activityService.events.length, 0);
});

test("rechaza campos fuera del conjunto seguro", () => {
    const task = new Task({
        id: "a",
        title: "Tarea",
        areaId: "area",
        status: "PENDING"
    });
    const repository = createRepository([task]);
    const service = createTaskService(repository);

    assert.throws(
        () => applyAtomicTaskUpdates(service, [
            { id: "a", changes: { title: "Otro título" } }
        ]),
        /campos no admitidos/i
    );
});
