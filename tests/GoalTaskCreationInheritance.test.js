import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { View } from "../src/core/View.js";
import {
    getTaskCreationDefaults,
    getTaskCreationView
} from "../src/core/TaskCreationDefaults.js";
import {
    DirectTaskCreationController
} from "../src/ui/DirectTaskCreationController.js";

function createGoalApp(goalId) {

    const created = [];
    const callbacks = {
        onOpenTaskCreation() {},
        onUpdateTask() {},
        onCloseTaskEditor() {}
    };

    const app = {
        currentView: View.GOAL,
        currentAreaId: null,
        selectedGoal: {
            id: goalId
        },
        selectedTask: null,
        taskCreationOpen: false,
        projectTaskCreationOpen: false,
        inlineSubtaskParentId: null,
        bulkSelectionMode: false,
        selectedTaskIds: new Set(),
        mainView: {
            callbacks,
            render() {},
            async confirmDiscardTaskChanges() {
                return true;
            }
        },
        taskService: {
            createTask(data) {
                const task = new Task(data);
                created.push(task);
                return task;
            }
        },
        getTodayString() {
            return "2026-08-07";
        },
        render() {}
    };

    return {
        app,
        callbacks,
        created
    };

}

test("la vista de objetivo admite creación directa y aporta su objetivo", () => {

    assert.equal(
        getTaskCreationView(View.GOAL),
        View.GOAL
    );

    assert.deepEqual(
        getTaskCreationDefaults(
            View.GOAL,
            "2026-08-07",
            { goalId: "goal-1" }
        ),
        {
            goalIds: ["goal-1"]
        }
    );

    assert.deepEqual(
        getTaskCreationDefaults(
            View.ALL,
            "2026-08-07",
            { goalId: "goal-1" }
        ),
        {}
    );

});

test("crear desde un subobjetivo hereda exactamente ese subobjetivo y conserva la vista", async () => {

    const context = createGoalApp(
        "subgoal-1"
    );
    const controller =
        new DirectTaskCreationController(
            context.app,
            {
                documentRef: {
                    getElementById() {
                        return null;
                    },
                    querySelector() {
                        return null;
                    }
                },
                windowRef: null
            }
        );

    controller.start();

    await context.callbacks
        .onOpenTaskCreation();

    const draft = context.app.selectedTask;

    assert.equal(
        context.app.currentView,
        View.GOAL
    );
    assert.deepEqual(
        draft.goalIds,
        ["subgoal-1"]
    );

    context.callbacks.onUpdateTask(
        draft.id,
        {
            title: "Definir próximos pasos",
            goalIds: [...draft.goalIds]
        }
    );

    assert.equal(context.created.length, 1);
    assert.deepEqual(
        context.created[0].goalIds,
        ["subgoal-1"]
    );
    assert.equal(
        context.app.currentView,
        View.GOAL
    );

});
