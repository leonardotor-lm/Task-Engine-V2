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
    previousProjectView = View.TODAY
}) {

    const byId = new Map(
        tasks.map(task => [task.id, task])
    );
    const renders = [];

    const app = {
        previousProjectView,
        projectTaskId: null,
        projectHistory: [],
        projectTaskCreationOpen: true,
        inlineSubtaskParentId: "inline-task",
        selectedTask: { id: "selected" },
        currentView: View.PROJECT,
        expandedTaskIds: new Set(),
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
            render(state) {
                renders.push(state);
            }
        },
        render() {
            renders.push({ appRender: true });
        }
    };

    return { app, renders };

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
