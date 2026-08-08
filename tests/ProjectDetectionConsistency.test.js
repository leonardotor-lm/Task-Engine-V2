import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import {
    ProjectWorkspaceController
} from "../src/ui/ProjectWorkspaceController.js";
import { ProjectView } from "../src/ui/ProjectView.js";

function createControllerApp({ task, descendants = [] }) {

    const openedProjects = [];
    const selectedTasks = [];

    const app = {
        currentView: "today",
        currentCustomFilterId: null,
        projectOriginCustomFilterId: null,
        projectHistory: [],
        taskService: {
            getTaskById(id) {
                return id === task.id
                    ? task
                    : descendants.find(
                        descendant =>
                            descendant.id === id
                    ) ?? null;
            },
            getProjectDescendants(id) {
                return id === task.id
                    ? descendants
                    : [];
            }
        },
        mainView: {
            callbacks: {
                onOpenProject(id) {
                    openedProjects.push(id);
                },
                onSelectTask(id) {
                    selectedTasks.push(id);
                }
            },
            render() {}
        }
    };

    return {
        app,
        openedProjects,
        selectedTasks
    };

}

test("una tarea sin descendientes visibles abre el editor y no un proyecto vacío", () => {

    const task = new Task({
        id: "leaf-task",
        title: "Tarea sin subtareas visibles"
    });

    const {
        app,
        openedProjects,
        selectedTasks
    } = createControllerApp({
        task,
        descendants: []
    });

    new ProjectWorkspaceController(
        app,
        { documentRef: null }
    ).start();

    app.mainView.callbacks.onOpenProject(task.id);

    assert.deepEqual(openedProjects, []);
    assert.deepEqual(selectedTasks, [task.id]);

});

test("una tarea con descendientes válidos conserva la navegación de proyecto", () => {

    const project = new Task({
        id: "real-project",
        title: "Proyecto real"
    });
    const child = new Task({
        id: "active-child",
        title: "Subtarea activa",
        parentTaskId: project.id
    });

    const {
        app,
        openedProjects,
        selectedTasks
    } = createControllerApp({
        task: project,
        descendants: [child]
    });

    new ProjectWorkspaceController(
        app,
        { documentRef: null }
    ).start();

    app.mainView.callbacks.onOpenProject(project.id);

    assert.deepEqual(openedProjects, [project.id]);
    assert.deepEqual(selectedTasks, []);

});

test("la presentación de un proyecto activo ignora descendientes archivados o en papelera", () => {

    const project = new Task({
        id: "project",
        title: "Proyecto"
    });
    const visibleChild = new Task({
        id: "visible-child",
        title: "Subtarea visible",
        parentTaskId: project.id
    });
    const archivedGrandchild = new Task({
        id: "archived-grandchild",
        title: "Archivada",
        parentTaskId: visibleChild.id
    });
    archivedGrandchild.archive();

    const deletedGrandchild = new Task({
        id: "deleted-grandchild",
        title: "En papelera",
        parentTaskId: visibleChild.id
    });
    deletedGrandchild.delete();

    const view = new ProjectView();
    const presentationTasks =
        view.getProjectPresentationTasks(
            project,
            [
                project,
                visibleChild,
                archivedGrandchild,
                deletedGrandchild
            ]
        );

    assert.deepEqual(
        presentationTasks.map(task => task.id),
        [project.id, visibleChild.id]
    );

    const html = view.render({
        projectTask: project,
        projectOriginView: "today",
        projectTaskCreationOpen: false,
        tasks: [visibleChild],
        allTasks: [
            project,
            visibleChild,
            archivedGrandchild,
            deletedGrandchild
        ],
        areas: [],
        contexts: [],
        tags: [],
        expandedTaskIds: new Set(),
        selectedTaskIds: new Set(),
        bulkSelectionEnabled: false,
        bulkActionMode: null,
        showTaskMetadata: true,
        today: "2026-08-08",
        goals: []
    });

    assert.doesNotMatch(html, /\(0\/1\)/);
    assert.doesNotMatch(html, /Archivada/);
    assert.doesNotMatch(html, /En papelera/);

});
