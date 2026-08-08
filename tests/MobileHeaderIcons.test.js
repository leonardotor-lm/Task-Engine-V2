import test from "node:test";
import assert from "node:assert/strict";

import { Goal } from "../src/domain/Goal.js";
import { Task } from "../src/domain/Task.js";
import { GoalEditor } from "../src/ui/GoalEditor.js";
import { GoalView } from "../src/ui/GoalView.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";
import { TaskList } from "../src/ui/TaskList.js";

test("el objetivo principal ofrece volver a la lista y editar con íconos accesibles", () => {

    const goal = new Goal({
        id: "goal-1",
        title: "Objetivo"
    });

    const html = new GoalView().render({
        selectedGoal: goal,
        tasks: [],
        allTasks: [],
        goals: [goal],
        areas: [],
        contexts: [],
        tags: [],
        goalExpandedTaskIds: new Set(),
        showTaskMetadata: true,
        today: "2026-07-29",
        inlineSubtaskParentId: null
    });

    assert.match(
        html,
        /aria-label="Volver a la lista de objetivos"/
    );
    assert.match(html, /aria-label="Editar objetivo"/);
    assert.doesNotMatch(html, /id="backToParentGoal"/);
    assert.match(html, /responsiveButtonIcon/);
    assert.match(html, /responsiveButtonLabel/);

});

test("un subobjetivo ofrece volver al padre y también a la lista", () => {

    const parent = new Goal({
        id: "goal-parent",
        title: "Objetivo padre"
    });
    const child = new Goal({
        id: "goal-child",
        title: "Subobjetivo",
        parentGoalId: parent.id
    });

    const html = new GoalView().render({
        selectedGoal: child,
        tasks: [],
        allTasks: [],
        goals: [parent, child],
        areas: [],
        contexts: [],
        tags: [],
        goalExpandedTaskIds: new Set(),
        showTaskMetadata: true,
        today: "2026-07-29",
        inlineSubtaskParentId: null
    });

    assert.match(html, /id="backToParentGoal"/);
    assert.match(
        html,
        /aria-label="Volver al objetivo Objetivo padre"/
    );
    assert.match(
        html,
        /aria-label="Volver a la lista de objetivos"/
    );

});

test("el control de detalles representa ambos estados", () => {

    const renderTaskList = showTaskMetadata =>
        new TaskList().render(
        [],
        "Tareas",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(),
        false,
        null,
        showTaskMetadata
    );

    const visible = renderTaskList(true);
    const hidden = renderTaskList(false);

    assert.match(visible, /aria-label="Ocultar detalles"/);
    assert.match(visible, /aria-pressed="true"/);
    assert.match(hidden, /aria-label="Mostrar detalles"/);
    assert.match(hidden, /aria-pressed="false"/);

});

test("los editores usan íconos para volver cerrar y guardar", () => {

    const taskHtml = new TaskEditor().render(
        new Task({
            id: "task-1",
            title: "Tarea"
        })
    );

    const goalHtml = new GoalEditor().render(
        new Goal({
            id: "goal-1",
            title: "Objetivo"
        })
    );

    assert.match(taskHtml, /aria-label="Guardar cambios"/);
    assert.match(taskHtml, /class="mobileBackSymbol"/);
    assert.match(goalHtml, /aria-label="Guardar objetivo"/);
    assert.match(goalHtml, /form="goalEditorForm"/);
    assert.match(goalHtml, /aria-label="Cerrar editor"/);

});
