import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import {
    ProjectWorkspaceController
} from "../src/ui/ProjectWorkspaceController.js";

function createButton(id = null) {

    const listeners = new Map();

    return {
        dataset: id ? { id } : {},
        addEventListener(type, handler) {
            listeners.set(type, handler);
        },
        click() {
            listeners.get("click")?.({
                currentTarget: this
            });
        }
    };

}

function createApp({
    tasks,
    previousProjectView = View.TODAY,
    currentView = View.PROJECT,
    currentCustomFilterId = null,
    customFilters = []
}) {

    const byId = new Map(
        tasks.map(task => [task.id, task])
    );
    const filterById = new Map(
        customFilters.map(filter => [filter.id, filter])
    );
    const renders = [];
    const appliedFilters = [];
    const openedProjects = [];
    const closedProjects = [];

    const app = {
        previousProjectView,
        projectOriginCustomFilterId: null,
        projectTaskId: null,
        projectHistory: [],
        projectTaskCreationOpen: true,
        inlineSubtaskParentId: "inline-task",
        selectedTask: { id: "selected" },
        currentView,
        currentCustomFilterId,
        expandedTaskIds: new Set(),
        customFilterService: {
            getFilterById(id) {
                return filterById.get(id) ?? null;
            }
        },
        taskService: {
            getTaskById(id) {
                return byId.get(id) ?? null;
            },
            getProjectDescendants(id) {
                const descendants = [];
                const visit = parentId => {
                    for (const task of tasks) {
                        if (task.parentTaskId !== parentId) {
                            continue;
                        }
                        descendants.push(task);
                        visit(task.id);
                    }
                };
                visit(id);
                return descendants;
            }
        },
        mainView: {
            callbacks: {},
            render(state) {
                renders.push(state);
            }
        },
        render() {
            renders.push({ appRender: true });
        }
    };

    app.mainView.callbacks.onOpenProject = id => {

        openedProjects.push(id);

        if (app.currentView !== View.PROJECT) {
            app.previousProjectView = app.currentView;
            app.projectHistory = [];
        }

        app.currentCustomFilterId = null;
        app.projectTaskId = id;
        app.currentView = View.PROJECT;
        app.render();

    };

    app.mainView.callbacks.onCloseProject = () => {

        closedProjects.push(true);
        app.currentView = app.previousProjectView;
        app.projectTaskId = null;
        app.projectHistory = [];
        app.render();

    };

    app.mainView.callbacks.onApplyCustomFilter = id => {

        const filter = filterById.get(id);

        if (!filter) return;

        appliedFilters.push(id);
        app.currentView = View.ALL;
        app.currentCustomFilterId = id;
        app.projectTaskId = null;
        app.projectHistory = [];
        app.projectTaskCreationOpen = false;
        app.inlineSubtaskParentId = null;
        app.selectedTask = null;
        app.render();

    };

    return {
        app,
        renders,
        appliedFilters,
        openedProjects,
        closedProjects
    };

}

test("inyecta la vista de origen al renderizar PROJECT", () => {

    const { app, renders } = createApp({
        tasks: [],
        previousProjectView: View.AREA
    });

    const controller = new ProjectWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll() {
                    return [];
                },
                getElementById() {
                    return null;
                }
            }
        }
    );

    controller.start();
    app.mainView.render({ view: View.PROJECT });

    assert.equal(
        renders[0].projectOriginView,
        View.AREA
    );

});

test("captura el filtro guardado antes de abrir un proyecto", () => {

    const filter = {
        id: "filter-subtasks",
        name: "Con subtareas",
        query: "tieneSubtareas:si"
    };
    const {
        app,
        renders,
        openedProjects
    } = createApp({
        tasks: [],
        currentView: View.ALL,
        currentCustomFilterId: filter.id,
        customFilters: [filter]
    });

    const controller = new ProjectWorkspaceController(
        app,
        { documentRef: null }
    );

    controller.start();
    app.mainView.callbacks.onOpenProject(
        "project-filtered"
    );
    app.mainView.render({ view: View.PROJECT });

    assert.deepEqual(
        openedProjects,
        ["project-filtered"]
    );
    assert.equal(
        app.projectOriginCustomFilterId,
        filter.id
    );
    assert.equal(app.currentCustomFilterId, null);
    assert.equal(
        renders.at(-1).projectOriginCustomFilter.id,
        filter.id
    );
    assert.equal(
        renders.at(-1).projectOriginCustomFilter.name,
        "Con subtareas"
    );

});

test("un ancestro del breadcrumb navega sin volver al proyecto hijo", () => {

    const root = {
        id: "root",
        parentTaskId: null
    };
    const parent = {
        id: "parent",
        parentTaskId: root.id
    };
    const child = {
        id: "child",
        parentTaskId: parent.id
    };
    const descendant = {
        id: "descendant",
        parentTaskId: parent.id
    };
    const ancestorButton = createButton(parent.id);

    const { app } = createApp({
        tasks: [root, parent, child, descendant]
    });

    const controller = new ProjectWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll(selector) {
                    return selector ===
                        ".projectBreadcrumbProject"
                        ? [ancestorButton]
                        : [];
                },
                getElementById() {
                    return null;
                }
            }
        }
    );

    controller.start();
    app.mainView.render({ view: View.PROJECT });
    ancestorButton.click();

    assert.equal(app.projectTaskId, parent.id);
    assert.deepEqual(
        app.projectHistory,
        [root.id]
    );
    assert.equal(app.projectTaskCreationOpen, false);
    assert.equal(app.inlineSubtaskParentId, null);
    assert.equal(app.selectedTask, null);
    assert.equal(app.currentView, View.PROJECT);
    assert.ok(app.expandedTaskIds.has(parent.id));
    assert.ok(app.expandedTaskIds.has(descendant.id));
    assert.ok(!app.projectHistory.includes(child.id));

});

test("la raíz del breadcrumb vuelve directamente a la vista de origen", () => {

    const rootButton = createButton();
    const { app } = createApp({
        tasks: [],
        previousProjectView: View.TOMORROW
    });

    app.projectTaskId = "project";
    app.projectHistory = ["one", "two"];

    const controller = new ProjectWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll() {
                    return [];
                },
                getElementById(id) {
                    return id === "projectBreadcrumbRoot"
                        ? rootButton
                        : null;
                }
            }
        }
    );

    controller.start();
    app.mainView.render({ view: View.PROJECT });
    rootButton.click();

    assert.equal(app.currentView, View.TOMORROW);
    assert.equal(app.projectTaskId, null);
    assert.deepEqual(app.projectHistory, []);
    assert.equal(app.projectTaskCreationOpen, false);
    assert.equal(app.inlineSubtaskParentId, null);
    assert.equal(app.selectedTask, null);

});

test("la raíz reaplica el filtro guardado de origen", () => {

    const filter = {
        id: "filter-subtasks",
        name: "Con subtareas",
        query: "tieneSubtareas:si"
    };
    const rootButton = createButton();
    const {
        app,
        appliedFilters
    } = createApp({
        tasks: [],
        previousProjectView: View.ALL,
        customFilters: [filter]
    });

    app.projectOriginCustomFilterId = filter.id;
    app.projectTaskId = "project";
    app.projectHistory = ["parent"];

    const controller = new ProjectWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll() {
                    return [];
                },
                getElementById(id) {
                    return id === "projectBreadcrumbRoot"
                        ? rootButton
                        : null;
                }
            }
        }
    );

    controller.start();
    app.mainView.render({ view: View.PROJECT });
    rootButton.click();

    assert.deepEqual(
        appliedFilters,
        [filter.id]
    );
    assert.equal(app.currentView, View.ALL);
    assert.equal(
        app.currentCustomFilterId,
        filter.id
    );
    assert.equal(
        app.projectOriginCustomFilterId,
        null
    );
    assert.equal(app.projectTaskId, null);
    assert.deepEqual(app.projectHistory, []);

});

test("atrás en móvil restaura el filtro al salir del nivel raíz del proyecto", () => {

    const filter = {
        id: "filter-subtasks",
        name: "Con subtareas",
        query: "tieneSubtareas:si"
    };
    const {
        app,
        appliedFilters,
        closedProjects
    } = createApp({
        tasks: [],
        previousProjectView: View.ALL,
        customFilters: [filter]
    });

    app.projectOriginCustomFilterId = filter.id;
    app.projectTaskId = "project";
    app.projectHistory = [];

    const controller = new ProjectWorkspaceController(
        app,
        { documentRef: null }
    );

    controller.start();
    app.mainView.callbacks.onCloseProject();

    assert.deepEqual(
        appliedFilters,
        [filter.id]
    );
    assert.equal(closedProjects.length, 0);
    assert.equal(
        app.currentCustomFilterId,
        filter.id
    );

});

test("si el filtro de origen ya no existe usa la vista base", () => {

    const rootButton = createButton();
    const {
        app,
        appliedFilters
    } = createApp({
        tasks: [],
        previousProjectView: View.ALL
    });

    app.projectOriginCustomFilterId =
        "deleted-filter";
    app.projectTaskId = "project";

    const controller = new ProjectWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll() {
                    return [];
                },
                getElementById(id) {
                    return id === "projectBreadcrumbRoot"
                        ? rootButton
                        : null;
                }
            }
        }
    );

    controller.start();
    app.mainView.render({ view: View.PROJECT });
    rootButton.click();

    assert.deepEqual(appliedFilters, []);
    assert.equal(app.currentView, View.ALL);
    assert.equal(
        app.projectOriginCustomFilterId,
        null
    );

});

test("no enlaza breadcrumb fuera de PROJECT", () => {

    let queried = false;
    const { app } = createApp({ tasks: [] });

    const controller = new ProjectWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll() {
                    queried = true;
                    return [];
                },
                getElementById() {
                    queried = true;
                    return null;
                }
            }
        }
    );

    controller.start();
    app.mainView.render({ view: View.TODAY });

    assert.equal(queried, false);

});
