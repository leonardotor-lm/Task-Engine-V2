import test from "node:test";
import assert from "node:assert/strict";

import { Goal } from "../src/domain/Goal.js";
import { GoalStatus } from "../src/domain/GoalStatus.js";
import { Task } from "../src/domain/Task.js";
import { GoalView } from "../src/ui/GoalView.js";

test("muestra el objetivo como espacio de trabajo", () => {

    const goal = new Goal({
        id: "goal-1",
        title: "Publicar un libro",
        description: "Preparar el manuscrito",
        dueDate: "2027-03-01"
    });

    const project = new Task({
        id: "project-1",
        title: "Preparar manuscrito",
        goalIds: ["goal-1"]
    });

    const subtask = new Task({
        id: "subtask-1",
        title: "Corregir capítulo",
        parentTaskId: project.id
    });

    const available = new Task({
        id: "task-1",
        title: "Buscar editorial"
    });

    const html = new GoalView().render({
        selectedGoal: goal,
        tasks: [project, subtask],
        allTasks: [
            project,
            subtask,
            available
        ],
        goals: [goal],
        areas: [],
        contexts: [],
        tags: [],
        goalExpandedTaskIds:
            new Set(),
        showTaskMetadata: true,
        today: "2026-07-28",
        inlineSubtaskParentId: null
    });

    assert.match(html, /Publicar un libro/);
    assert.match(html, /Preparar el manuscrito/);
    assert.match(html, /2027-03-01/);
    assert.match(html, /id="editGoal"/);
    assert.match(html, /id="closeGoalView"/);
    assert.match(html, /id="goalBreadcrumbRoot"/);
    assert.doesNotMatch(html, /id="backToParentGoal"/);
    assert.match(html, /Preparar manuscrito/);
    assert.doesNotMatch(
        html,
        /Asociaciones directas/
    );
    assert.doesNotMatch(html, /Corregir capítulo/);
    assert.match(html, /Expandir subtareas/);
    assert.doesNotMatch(
        html,
        /class="detachTaskFromGoal"/
    );
    assert.doesNotMatch(html, /id="goalTaskForm"/);

});

test("despliega las subtareas de un proyecto a pedido", () => {

    const goal = new Goal({
        id: "goal-1",
        title: "Publicar un libro"
    });

    const project = new Task({
        id: "project-1",
        title: "Preparar manuscrito",
        goalIds: [goal.id]
    });

    const subtask = new Task({
        id: "subtask-1",
        title: "Corregir capítulo",
        parentTaskId: project.id
    });

    const html = new GoalView().render({
        selectedGoal: goal,
        tasks: [project, subtask],
        allTasks: [project, subtask],
        goals: [goal],
        areas: [],
        contexts: [],
        tags: [],
        goalExpandedTaskIds:
            new Set([project.id]),
        showTaskMetadata: true,
        today: "2026-07-28",
        inlineSubtaskParentId: null
    });

    assert.match(html, /Corregir capítulo/);
    assert.match(html, /Contraer subtareas/);

});

test("muestra subobjetivos directos y los incluye en el progreso", () => {

    const goal = new Goal({
        id: "goal-1",
        title: "Mejorar español"
    });
    const activeSubgoal = new Goal({
        id: "goal-2",
        title: "Practicar conversación",
        parentGoalId: goal.id
    });
    const completedSubgoal = new Goal({
        id: "goal-3",
        title: "Completar nivel inicial",
        parentGoalId: goal.id,
        status: GoalStatus.COMPLETED
    });
    const grandchild = new Goal({
        id: "goal-4",
        title: "Conversación avanzada",
        parentGoalId: activeSubgoal.id
    });
    const archivedSubgoal = new Goal({
        id: "goal-5",
        title: "Plan archivado",
        parentGoalId: goal.id,
        status: GoalStatus.ARCHIVED
    });

    const html = new GoalView().render({
        selectedGoal: goal,
        tasks: [],
        allTasks: [],
        goals: [
            goal,
            activeSubgoal,
            completedSubgoal,
            grandchild,
            archivedSubgoal
        ],
        areas: [],
        contexts: [],
        tags: [],
        goalExpandedTaskIds: new Set(),
        showTaskMetadata: true,
        today: "2026-08-08",
        inlineSubtaskParentId: null
    });

    assert.match(html, /Subobjetivos 1\/2/);
    assert.match(html, /Practicar conversación/);
    assert.match(html, /Completar nivel inicial/);
    assert.match(
        html,
        /class="openGoal goalWorkspaceSubgoal"/
    );
    assert.doesNotMatch(html, /Conversación avanzada/);
    assert.doesNotMatch(html, /Plan archivado/);
    assert.doesNotMatch(html, /Tareas 0\/0/);

});

test("muestra la ruta jerárquica y permite volver al padre", () => {

    const root = new Goal({
        id: "goal-root",
        title: "Aprender idiomas"
    });
    const parent = new Goal({
        id: "goal-parent",
        title: "Español",
        parentGoalId: root.id
    });
    const current = new Goal({
        id: "goal-current",
        title: "Conversación",
        parentGoalId: parent.id
    });

    const html = new GoalView().render({
        selectedGoal: current,
        tasks: [],
        allTasks: [],
        goals: [current, root, parent],
        areas: [],
        contexts: [],
        tags: [],
        goalExpandedTaskIds: new Set(),
        showTaskMetadata: true,
        today: "2026-08-08",
        inlineSubtaskParentId: null
    });

    assert.match(html, /id="backToParentGoal"/);
    assert.match(
        html,
        /id="backToParentGoal"[\s\S]*data-id="goal-parent"/
    );
    assert.match(html, /id="goalBreadcrumbRoot"/);
    assert.match(
        html,
        /data-id="goal-root"[\s\S]*Aprender idiomas[\s\S]*data-id="goal-parent"[\s\S]*Español[\s\S]*aria-current="page"[\s\S]*Conversación/
    );

});
