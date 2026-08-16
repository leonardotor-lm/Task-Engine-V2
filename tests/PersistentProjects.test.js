import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { TaskService } from "../src/core/TaskService.js";
import { View } from "../src/core/View.js";
import {
    getTaskCreationDefaults,
    getTaskCreationView
} from "../src/core/TaskCreationDefaults.js";
import { Sidebar } from "../src/ui/Sidebar.js";
import { ViewRouter } from "../src/ui/ViewRouter.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";
import { TaskList } from "../src/ui/TaskList.js";

class MemoryRepository {

    constructor(tasks = []) {
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

    add(data) {
        const task = new Task(data);
        this.tasks.push(task);
        return task;
    }

    update(task) {
        const index = this.tasks.findIndex(
            item => item.id === task.id
        );
        this.tasks[index] = task;
    }

    updateMany(tasks) {
        for (const task of tasks) {
            this.update(task);
        }
    }

}

test("la identidad de proyecto se conserva al actualizar y serializar", () => {

    const task = new Task({
        title: "Reforma",
        isProject: true
    });

    assert.equal(task.isProject, true);
    assert.equal(task.toJSON().isProject, true);

    task.update({ isProject: false });

    assert.equal(task.isProject, false);

});

test("migra como proyectos todos los niveles que ya tienen subtareas", () => {

    const root = new Task({
        id: "root",
        title: "Proyecto",
        version: 4,
        createdAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-10T12:00:00.000Z"
    });
    const nested = new Task({
        id: "nested",
        title: "Subproyecto",
        parentTaskId: root.id
    });
    const leaf = new Task({
        id: "leaf",
        title: "Paso",
        parentTaskId: nested.id
    });
    const service = new TaskService(
        new MemoryRepository([
            root,
            nested,
            leaf
        ])
    );

    const migrated = service.ensureProjectFlags();

    assert.deepEqual(
        migrated.map(task => task.id),
        ["root", "nested"]
    );
    assert.equal(root.isProject, true);
    assert.equal(nested.isProject, true);
    assert.equal(leaf.isProject, false);
    assert.equal(root.version, 4);
    assert.equal(
        root.updatedAt,
        "2026-08-10T12:00:00.000Z"
    );

});

test("crear una subtarea marca automáticamente a su padre como proyecto", () => {

    const parent = new Task({
        id: "parent",
        title: "Preparar viaje"
    });
    const service = new TaskService(
        new MemoryRepository([parent])
    );

    service.createSubtask(
        parent.id,
        "Reservar hotel"
    );

    assert.equal(parent.isProject, true);

});

test("la vista global muestra raíces activas y conserva proyectos vacíos", () => {

    const root = new Task({
        id: "root",
        title: "Proyecto raíz",
        isProject: true
    });
    const nested = new Task({
        id: "nested",
        title: "Subproyecto",
        isProject: true,
        parentTaskId: root.id
    });
    const child = new Task({
        id: "child",
        title: "Paso",
        parentTaskId: nested.id
    });
    const empty = new Task({
        id: "empty",
        title: "Proyecto sin pasos",
        isProject: true
    });
    const completed = new Task({
        id: "completed",
        title: "Proyecto terminado",
        isProject: true,
        status: TaskStatus.COMPLETED
    });
    const service = new TaskService(
        new MemoryRepository([
            root,
            nested,
            child,
            empty,
            completed
        ])
    );

    assert.deepEqual(
        service.getActiveProjectRoots()
            .map(task => task.id),
        ["root", "empty"]
    );
    assert.deepEqual(
        service.getActiveProjectTasks()
            .map(task => task.id),
        ["root", "nested", "child", "empty"]
    );

});

test("un proyecto con subtareas no puede perder su identidad", () => {

    const project = new Task({
        id: "project",
        title: "Proyecto",
        isProject: true
    });
    const child = new Task({
        id: "child",
        title: "Paso",
        parentTaskId: project.id
    });
    const service = new TaskService(
        new MemoryRepository([
            project,
            child
        ])
    );

    assert.throws(
        () => service.updateTask(
            project.id,
            { isProject: false }
        ),
        /debe seguir siendo un proyecto/
    );

});

test("Proyectos crea proyectos y dispone de navegación propia", () => {

    assert.deepEqual(
        getTaskCreationDefaults(
            View.PROJECTS,
            "2026-08-15"
        ),
        { isProject: true }
    );
    assert.equal(
        getTaskCreationView(View.PROJECTS),
        View.PROJECTS
    );

    const sidebar = new Sidebar().render(
        View.PROJECTS,
        "",
        [],
        null,
        [],
        [],
        {},
        "MANUAL",
        false,
        false,
        "",
        0,
        false,
        "",
        null,
        false,
        false,
        false,
        null,
        false,
        false,
        "",
        [],
        null,
        { projects: 2 }
    );

    assert.match(sidebar, /id="showProjects"/);
    assert.match(sidebar, /Proyectos[\s\S]*?\(2\)/);

    const html = new ViewRouter().render({
        view: View.PROJECTS,
        tasks: [],
        allTasks: [],
        areas: [],
        contexts: [],
        tags: [],
        goals: [],
        searchQuery: "",
        expandedTaskIds: new Set(),
        filtersActive: false,
        selectedTaskIds: new Set(),
        bulkSelectionEnabled: false,
        bulkActionMode: "ACTIVE",
        showTaskMetadata: true,
        today: "2026-08-15",
        taskViewCounts: { projects: 2 }
    });

    assert.match(html, /<h2>Proyectos \(2\)<\/h2>/);

});

test("el editor permite identificar proyectos y bloquea desmarcar los que tienen pasos", () => {

    const project = new Task({
        id: "project",
        title: "Proyecto",
        isProject: true
    });
    const child = new Task({
        id: "child",
        title: "Paso",
        parentTaskId: project.id
    });
    const html = new TaskEditor().render(
        project,
        [],
        [],
        [],
        [project, child]
    );

    assert.match(
        html,
        /id="taskIsProject"[\s\S]*?checked[\s\S]*?disabled/
    );

    const emptyProject = new Task({
        id: "empty",
        title: "Proyecto vacío",
        isProject: true
    });
    const listHtml = new TaskList().render(
        [emptyProject],
        "Proyectos",
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
        "2026-08-15",
        [emptyProject]
    );

    assert.match(
        listHtml,
        /class="task[^\"]*projectTask/
    );

});
