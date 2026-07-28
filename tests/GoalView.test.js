import test from "node:test";
import assert from "node:assert/strict";

import { Goal } from "../src/domain/Goal.js";
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
        areas: [],
        contexts: [],
        tags: [],
        expandedTaskIds:
            new Set([project.id]),
        showTaskMetadata: true,
        today: "2026-07-28",
        inlineSubtaskParentId: null
    });

    assert.match(html, /Publicar un libro/);
    assert.match(html, /Preparar el manuscrito/);
    assert.match(html, /2027-03-01/);
    assert.match(html, /id="editGoal"/);
    assert.match(html, /id="closeGoalView"/);
    assert.match(html, /Preparar manuscrito/);
    assert.match(html, /Corregir capítulo/);
    assert.match(
        html,
        /class="detachTaskFromGoal"/
    );
    assert.match(html, /id="goalTaskForm"/);

});
