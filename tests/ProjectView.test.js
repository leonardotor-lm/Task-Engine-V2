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
        /Proyecto &lt;escolar&gt; · 0\/2/
    );

    assert.match(html, /Primera etapa/);
    assert.match(html, /Paso interno/);
    assert.match(html, /id="closeProjectView"/);
    assert.match(html, /id="editProjectTask"/);

});

test("la vista PROJECT forma parte de las vistas disponibles", () => {

    assert.equal(
        View.PROJECT,
        "project"
    );

});
