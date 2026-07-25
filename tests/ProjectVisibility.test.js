import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

class MemoryRepository {

    constructor(tasks) {
        this.tasks = tasks;
    }

    getAll() {
        return [...this.tasks];
    }

    getById(id) {
        return this.tasks.find(
            task => task.id === id
        ) ?? null;
    }

}

test("un proyecto activo no muestra descendientes borrados ni archivados", () => {

    const project = new Task({
        id: "project",
        title: "Proyecto"
    });

    const active = new Task({
        id: "active",
        title: "Activa",
        parentTaskId: project.id
    });

    const completed = new Task({
        id: "completed",
        title: "Completada",
        parentTaskId: project.id,
        status: TaskStatus.COMPLETED
    });

    const deleted = new Task({
        id: "deleted",
        title: "Borrada",
        parentTaskId: project.id,
        status: TaskStatus.DELETED
    });

    const archived = new Task({
        id: "archived",
        title: "Archivada",
        parentTaskId: project.id,
        status: TaskStatus.ARCHIVED
    });

    const service = new TaskService(
        new MemoryRepository([
            project,
            active,
            completed,
            deleted,
            archived
        ])
    );

    assert.deepEqual(
        service
            .getProjectDescendants(project.id)
            .map(task => task.id),
        ["active", "completed"]
    );

});

test("un proyecto de la papelera muestra su árbol borrado", () => {

    const project = new Task({
        id: "deleted-project",
        title: "Proyecto borrado",
        status: TaskStatus.DELETED
    });

    const child = new Task({
        id: "deleted-child",
        title: "Hija borrada",
        parentTaskId: project.id,
        status: TaskStatus.DELETED
    });

    const service = new TaskService(
        new MemoryRepository([
            project,
            child
        ])
    );

    assert.deepEqual(
        service
            .getProjectDescendants(project.id)
            .map(task => task.id),
        ["deleted-child"]
    );

});
