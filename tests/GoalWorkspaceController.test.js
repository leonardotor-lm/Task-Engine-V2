import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import {
    GoalWorkspaceController
} from "../src/ui/GoalWorkspaceController.js";

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
        },
        hasListener(type) {
            return listeners.has(type);
        }
    };

}

test("permite navegar entre subobjetivos y ancestros", () => {

    const subgoalButton = createButton("goal-child");
    const breadcrumbButton = createButton("goal-parent");
    const selectedGoalIds = [];

    const app = {
        mainView: {
            callbacks: {
                onSelectGoal(id) {
                    selectedGoalIds.push(id);
                },
                onCloseGoalView() {}
            },
            render() {}
        }
    };

    const controller = new GoalWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll(selector) {
                    return selector ===
                        ".goalWorkspaceSubgoal, .goalBreadcrumbGoal"
                        ? [subgoalButton, breadcrumbButton]
                        : [];
                },
                getElementById() {
                    return null;
                }
            }
        }
    );

    controller.start();
    app.mainView.render({ view: View.GOAL });

    subgoalButton.click();
    breadcrumbButton.click();

    assert.deepEqual(
        selectedGoalIds,
        ["goal-child", "goal-parent"]
    );

});

test("Atrás abre el objetivo padre inmediato", () => {

    const backButton = createButton("goal-parent");
    let selectedGoalId = null;

    const app = {
        mainView: {
            callbacks: {
                onSelectGoal(id) {
                    selectedGoalId = id;
                },
                onCloseGoalView() {}
            },
            render() {}
        }
    };

    const controller = new GoalWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll() {
                    return [];
                },
                getElementById(id) {
                    return id === "backToParentGoal"
                        ? backButton
                        : null;
                }
            }
        }
    );

    controller.start();
    app.mainView.render({ view: View.GOAL });
    backButton.click();

    assert.equal(selectedGoalId, "goal-parent");

});

test("la raíz de la ruta vuelve a Objetivos", () => {

    const rootButton = createButton();
    let closed = false;

    const app = {
        mainView: {
            callbacks: {
                onSelectGoal() {},
                onCloseGoalView() {
                    closed = true;
                }
            },
            render() {}
        }
    };

    const controller = new GoalWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll() {
                    return [];
                },
                getElementById(id) {
                    return id === "goalBreadcrumbRoot"
                        ? rootButton
                        : null;
                }
            }
        }
    );

    controller.start();
    app.mainView.render({ view: View.GOAL });
    rootButton.click();

    assert.equal(closed, true);

});

test("no enlaza navegación fuera de GOAL", () => {

    let queried = false;

    const app = {
        mainView: {
            callbacks: {
                onSelectGoal() {},
                onCloseGoalView() {}
            },
            render() {}
        }
    };

    const controller = new GoalWorkspaceController(
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
