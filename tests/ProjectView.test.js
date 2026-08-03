import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import { Task } from "../src/domain/Task.js";
import { ProjectView } from "../src/ui/ProjectView.js";

test("la vista de proyecto muestra todo el árbol y sus acciones", () => {

    const project = new Task({
        id: "project",
        title: "Proyecto <escolar>"
    });

    const child = new Task({
        id: "child",
        title: "Primera etapa",
        parentTaskId: project.id
    });

    const grandchild = new Task({
        id: "grandchild",
        title: "Paso interno",
        parentTaskId: child.id
    });

    const html = new ProjectView().render({
        projectTask: project,
        projectTaskCreationOpen: false,
        tasks: [child, grandchild],
        allTasks: [project, child, grandchild],
        areas: [],
        contexts: [],
        tags: [],
        expandedTaskIds: new Set([
            child.id,
            grandchild.id
        ]),
        showTaskMetadata: true,
        today: "2026-07-25"
    });

    assert.match(
        html,
        /<h2>Proyecto &lt;escolar&gt;<\/h2>/
    );
    assert.match(html, /0 de 2 completadas/);
    assert.match(
        html,
        /<main class="content projectWorkspace">/
    );

    assert.match(html, /Primera etapa/);
    assert.match(html, /Paso interno/);
    assert.match(html, /id="closeProjectView"/);
    assert.match(html, /id="editProjectTask"/);
    assert.match(
        html,
        /id="openProjectTaskCreation"/
    );
    assert.equal(
        html.match(/projectHeadingAction/g)?.length,
        3
    );
    assert.match(html, /aria-label="Volver"/);
    assert.match(html, /aria-label="Editar proyecto"/);
    assert.match(html, /aria-label="Agregar subtarea"/);
    assert.match(html, /responsiveButtonIcon/);

});

test("abre un formulario contextual para crear una subtarea", () => {

    const project = new Task({
        id: "project-form",
        title: "Proyecto"
    });

    const html = new ProjectView().render({
        projectTask: project,
        projectTaskCreationOpen: true,
        tasks: [],
        allTasks: [project],
        areas: [],
        contexts: [],
        tags: [],
        expandedTaskIds: new Set(),
        showTaskMetadata: true,
        today: "2026-07-25"
    });

    assert.match(html, /id="taskForm"/);
    assert.match(
        html,
        /placeholder="Nueva subtarea"/
    );

    assert.doesNotMatch(
        html,
        /id="openProjectTaskCreation"/
    );

});

test("indica cuando Volver regresa a un proyecto anterior", () => {

    const project = new Task({
        id: "nested-project",
        title: "Subproyecto"
    });

    const html = new ProjectView().render({
        projectTask: project,
        projectTaskCreationOpen: false,
        projectNavigationDepth: 1,
        tasks: [],
        allTasks: [project],
        areas: [],
        contexts: [],
        tags: [],
        expandedTaskIds: new Set(),
        showTaskMetadata: true,
        today: "2026-07-25"
    });

    assert.match(
        html,
        /aria-label="Volver al proyecto anterior"/
    );

});

test("la vista PROJECT forma parte de las vistas disponibles", () => {

    assert.equal(
        View.PROJECT,
        "project"
    );

});
