import test from "node:test";
import assert from "node:assert/strict";

import { ActivityService } from "../src/core/ActivityService.js";
import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

class FailingActivityRepository {
    add() {
        throw new Error("fallo simulado del historial");
    }

    getAll() {
        return [];
    }
}

class MemoryTaskRepository {
    constructor(tasks = []) {
        this.tasks = [...tasks];
    }

    getAll() {
        return [...this.tasks];
    }

    getById(id) {
        return this.tasks.find(task => task.id === id) ?? null;
    }

    add(data) {
        const task = new Task(data);
        this.tasks.push(task);
        return task;
    }

    update(task) {
        const index = this.tasks.findIndex(item => item.id === task.id);
        if (index === -1) {
            throw new Error("La tarea no existe.");
        }
        this.tasks[index] = task;
    }

    updateMany(tasks) {
        const replacements = new Map(
            tasks.map(task => [task.id, task])
        );
        this.tasks = this.tasks.map(task =>
            replacements.get(task.id) ?? task
        );
    }

    replaceAll(tasks) {
        this.tasks = [...tasks];
    }

    remove(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
    }
}

function createTaskService(tasks = []) {
    const repository = new MemoryTaskRepository(tasks);
    const activityService = new ActivityService(
        new FailingActivityRepository()
    );

    return {
        repository,
        service: new TaskService(repository, activityService)
    };
}

test("crear y editar una tarea sigue funcionando si falla el historial", () => {
    const { repository, service } = createTaskService();

    const task = assert.doesNotThrow(() =>
        service.createTask({
            id: "task-1",
            title: "Preparar clase"
        })
    );

    const created = repository.getById("task-1");
    assert.ok(created);
    assert.equal(created.title, "Preparar clase");

    assert.doesNotThrow(() =>
        service.updateTask("task-1", {
            title: "Preparar clase de Literatura",
            priority: 3
        })
    );

    const updated = repository.getById("task-1");
    assert.equal(updated.title, "Preparar clase de Literatura");
    assert.equal(updated.priority, 3);
});

test("una operación masiva persiste aunque falle el historial", () => {
    const first = new Task({
        id: "task-1",
        title: "Primera",
        status: TaskStatus.PENDING,
        areaId: "area-1"
    });
    const second = new Task({
        id: "task-2",
        title: "Segunda",
        status: TaskStatus.PENDING,
        areaId: "area-1"
    });
    const { repository, service } = createTaskService([
        first,
        second
    ]);

    assert.doesNotThrow(() =>
        service.completeTasks(["task-1", "task-2"])
    );

    assert.equal(
        repository.getById("task-1").status,
        TaskStatus.COMPLETED
    );
    assert.equal(
        repository.getById("task-2").status,
        TaskStatus.COMPLETED
    );
});
