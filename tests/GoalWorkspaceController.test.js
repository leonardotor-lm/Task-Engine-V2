import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import {
    GoalWorkspaceController
} from "../src/ui/GoalWorkspaceController.js";

test("permite abrir un subobjetivo desde la vista del objetivo", () => {

    let clickHandler = null;
    let selectedGoalId = null;
    let renders = 0;

    const button = {
        dataset: {
            id: "goal-child"
        },
        addEventListener(type, handler) {
            if (type === "click") {
                clickHandler = handler;
            }
        }
    };

    const app = {
        mainView: {
            callbacks: {
                onSelectGoal(id) {
                    selectedGoalId = id;
                }
            },
            render() {
                renders += 1;
            }
        }
    };

    const controller = new GoalWorkspaceController(
        app,
        {
            documentRef: {
                querySelectorAll(selector) {
                    return selector ===
                        ".goalWorkspaceSubgoal"
                        ? [button]
                        : [];
                }
            }
        }
    );

    controller.start();
    app.mainView.render({
        view: View.GOAL
    });

    assert.equal(renders, 1);
    assert.equal(typeof clickHandler, "function");

    clickHandler();

    assert.equal(
        selectedGoalId,
        "goal-child"
    );

});

test("no agrega navegación de subobjetivos fuera de la vista GOAL", () => {

    let queried = false;

    const app = {
        mainView: {
            callbacks: {
                onSelectGoal() {}
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
                }
            }
        }
    );

    controller.start();
    app.mainView.render({
        view: View.TODAY
    });

    assert.equal(queried, false);

});
