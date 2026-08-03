import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { Goal } from "../src/domain/Goal.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";

test("el editor permite asociar múltiples objetivos", () => {

    const task = new Task({
        title: "Preparar proyecto",
        goalIds: ["goal-2"]
    });

    const goals = [
        new Goal({
            id: "goal-1",
            title: "Mejorar planificación"
        }),
        new Goal({
            id: "goal-2",
            title: "Terminar el curso"
        })
    ];

    const html = new TaskEditor().render(
        task,
        [],
        [],
        [],
        [],
        goals
    );

    assert.match(html, /<legend>Objetivos<\/legend>/);
    assert.match(html, /class="taskGoal"/);
    assert.match(
        html,
        /class="searchableMultiSelectChip"[\s\S]*value="goal-2"/
    );
    assert.match(html, /id="taskGoalsSearch"/);

});

test("el editor oculta objetivos archivados", () => {

    const task = new Task({
        title: "Preparar proyecto"
    });

    const archivedGoal = new Goal({
        id: "goal-archived",
        title: "Objetivo archivado",
        status: "ARCHIVED"
    });

    const html = new TaskEditor().render(
        task,
        [],
        [],
        [],
        [],
        [archivedGoal]
    );

    assert.doesNotMatch(
        html,
        /Objetivo archivado/
    );

});

test("preserva ocultas las asociaciones con objetivos en papelera", () => {
    const deletedGoal = new Goal({
        id: "goal-deleted",
        title: "Objetivo en papelera",
        status: "DELETED"
    });
    const activeGoal = new Goal({
        id: "goal-active",
        title: "Objetivo activo"
    });
    const task = new Task({
        title: "Tarea asociada",
        goalIds: [deletedGoal.id, activeGoal.id]
    });

    const html = new TaskEditor().render(
        task,
        [],
        [],
        [],
        [],
        [deletedGoal, activeGoal]
    );

    assert.doesNotMatch(
        html,
        /Objetivo en papelera/
    );
    assert.match(
        html,
        /class="taskGoal taskGoalPreserved"[\s\S]*?value="goal-deleted"/
    );
    assert.match(html, /Objetivo activo/);
});
