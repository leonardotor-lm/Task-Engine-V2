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
        projectOriginView: View.TODAY,
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
    assert.match(html, /id="projectBreadcrumbRoot"/);
    assert.match(html, />\s*Hoy\s*<\/button>/);
    assert.doesNotMatch(html, /id="closeProjectView"/);
    assert.match(html, /id="editProjectTask"/);
    assert.match(
        html,
        /id="openProjectTaskCreation"/
    );
    assert.equal(
        html.match(/projectHeadingAction/g)?.length,
        2
    );
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
        projectOriginView: View.ALL,
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

test("reconstruye la ruta de proyectos desde parentTaskId", () => {

    const root = new Task({
        id: "root-project",
        title: "Preparar viaje"
    });
    const parent = new Task({
        id: "parent-project",
        title: "Reservas",
        parentTaskId: root.id
    });
    const current = new Task({
        id: "current-project",
        title: "Hotel",
        parentTaskId: parent.id
    });

    const html = new ProjectView().render({
        projectTask: current,
        projectOriginView: View.TODAY,
        projectTaskCreationOpen: false,
        tasks: [],
        allTasks: [current, root, parent],
        areas: [],
        contexts: [],
        tags: [],
        expandedTaskIds: new Set(),
        showTaskMetadata: true,
        today: "2026-07-25"
    });

    assert.match(html, /aria-label="Ruta de proyectos"/);
    assert.match(
        html,
        /projectBreadcrumbRoot[\s\S]*Hoy[\s\S]*data-id="root-project"[\s\S]*Preparar viaje[\s\S]*data-id="parent-project"[\s\S]*Reservas[\s\S]*aria-current="page"[\s\S]*Hotel/
    );
    assert.doesNotMatch(html, /id="closeProjectView"/);

});

test("usa el área de origen como raíz contextual", () => {

    const project = new Task({
        id: "area-project",
        title: "Reforma"
    });

    const html = new ProjectView().render({
        projectTask: project,
        projectOriginView: View.AREA,
        activeArea: {
            id: "area-home",
            name: "Casa"
        },
        projectTaskCreationOpen: false,
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
        /projectBreadcrumbRoot[\s\S]*Casa/
    );

});

test("usa el nombre del filtro guardado como raíz contextual", () => {

    const project = new Task({
        id: "filter-project",
        title: "Proyecto filtrado"
    });

    const html = new ProjectView().render({
        projectTask: project,
        projectOriginView: View.ALL,
        projectOriginCustomFilter: {
            id: "filter-subtasks",
            name: "Con subtareas",
            query: "tieneSubtareas:si"
        },
        projectTaskCreationOpen: false,
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
        /projectBreadcrumbRoot[\s\S]*Con subtareas/
    );
    assert.doesNotMatch(
        html,
        /tieneSubtareas:si/
    );

});

test("corta una cadena de padres rota sin bloquear la vista", () => {

    const project = new Task({
        id: "orphan-project",
        title: "Proyecto huérfano",
        parentTaskId: "missing-parent"
    });

    const html = new ProjectView().render({
        projectTask: project,
        projectOriginView: View.ALL,
        projectTaskCreationOpen: false,
        tasks: [],
        allTasks: [project],
        areas: [],
        contexts: [],
        tags: [],
        expandedTaskIds: new Set(),
        showTaskMetadata: true,
        today: "2026-07-25"
    });

    assert.match(html, /Todas/);
    assert.match(html, /Proyecto huérfano/);
    assert.doesNotMatch(
        html,
        /data-id="missing-parent"/
    );

});

test("la vista PROJECT forma parte de las vistas disponibles", () => {

    assert.equal(
        View.PROJECT,
        "project"
    );

});
