import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";
import {
    installTaskServiceTransactionGuard
} from "../src/core/TaskServiceTransactionGuard.js";

function createRepository(
    tasks,
    { failOnUpdate = null, failOnAdd = false } = {}
) {
    return {
        tasks: [...tasks],
        updateCount: 0,
        getAll() {
            return [...this.tasks];
        },
        getById(id) {
            return this.tasks.find(task => task.id === id) ?? null;
        },
        update(task) {
            this.updateCount += 1;
            const index = this.tasks.findIndex(
                current => current.id === task.id
            );
            this.tasks[index] = task;
            if (this.updateCount === failOnUpdate) {
                throw new Error("fallo simulado de persistencia");
            }
        },
        updateMany(nextTasks) {
            const replacements = new Map(
                nextTasks.map(task => [task.id, task])
            );
            this.tasks = this.tasks.map(task =>
                replacements.get(task.id) ?? task
            );
        },
        add(data) {
            if (failOnAdd) {
                throw new Error("fallo simulado al crear");
            }
            const task = data instanceof Task
                ? data
                : new Task(data);
            this.tasks.push(task);
            return task;
        },
        remove(id) {
            this.tasks = this.tasks.filter(task => task.id !== id);
        },
        replaceAll(nextTasks) {
            this.tasks = [...nextTasks];
        }
    };
}

function createActivityService() {
    const repository = {
        events: [],
        getAll() {
            return [...this.events];
        },
        replaceAll(events) {
            this.events = [...events];
        }
    };

    return {
        repository,
        recordTask(type, task) {
            repository.events.push({ type, taskId: task.id });
        },
        recordTasks(type, tasks) {
            repository.events.push({
                type,
                taskIds: tasks.map(task => task.id)
            });
        },
        describeChanges() {
            return "Cambio";
        }
    };
}

function guardedService(repository) {
    const activityService = createActivityService();
    const service = new TaskService(
        repository,
        activityService
    );
    installTaskServiceTransactionGuard(service);
    return { service, activityService };
}

test("restaura tarea recurrente e historial si falla crear la siguiente instancia", () => {
    const recurring = new Task({
        id: "recurring",
        title: "Revisión semanal",
        status: "PENDING",
        recurrence: "DAILY",
        dueDate: "2026-08-24"
    });
    const repository = createRepository(
        [recurring],
        { failOnAdd: true }
    );
    const { service, activityService } =
        guardedService(repository);

    assert.throws(
        () => service.toggleTask("recurring"),
        /fallo simulado al crear/
    );

    assert.equal(
        repository.getById("recurring").status,
        "PENDING"
    );
    assert.equal(repository.getAll().length, 1);
    assert.equal(
        activityService.repository.events.length,
        0
    );
});

test("restaura todo el árbol si falla una eliminación intermedia", () => {
    const root = new Task({
        id: "root",
        title: "Proyecto",
        status: "PENDING",
        isProject: true
    });
    const child = new Task({
        id: "child",
        title: "Paso",
        status: "PENDING",
        parentTaskId: "root"
    });
    const repository = createRepository(
        [root, child],
        { failOnUpdate: 2 }
    );
    const { service, activityService } =
        guardedService(repository);

    assert.throws(
        () => service.deleteTask("root"),
        /fallo simulado de persistencia/
    );

    assert.deepEqual(
        repository.getAll().map(task => task.status),
        ["PENDING", "PENDING"]
    );
    assert.equal(
        activityService.repository.events.length,
        0
    );
});

test("restaura movimiento y padre si falla marcar el proyecto", () => {
    const task = new Task({
        id: "task",
        title: "Tarea",
        status: "PENDING"
    });
    const parent = new Task({
        id: "parent",
        title: "Destino",
        status: "PENDING",
        isProject: false
    });
    const repository = createRepository(
        [task, parent],
        { failOnUpdate: 2 }
    );
    const { service, activityService } =
        guardedService(repository);

    assert.throws(
        () => service.moveTaskToProject(
            "task",
            "parent"
        ),
        /fallo simulado de persistencia/
    );

    assert.equal(
        repository.getById("task").parentTaskId,
        null
    );
    assert.equal(
        repository.getById("parent").isProject,
        false
    );
    assert.equal(
        activityService.repository.events.length,
        0
    );
});

test("conserva normalmente una operación compuesta exitosa", () => {
    const task = new Task({
        id: "task",
        title: "Tarea",
        status: "PENDING"
    });
    const parent = new Task({
        id: "parent",
        title: "Destino",
        status: "PENDING",
        isProject: false
    });
    const repository = createRepository([task, parent]);
    const { service, activityService } =
        guardedService(repository);

    service.moveTaskToProject("task", "parent");

    assert.equal(
        repository.getById("task").parentTaskId,
        "parent"
    );
    assert.equal(
        repository.getById("parent").isProject,
        true
    );
    assert.equal(
        activityService.repository.events.length,
        1
    );
});
