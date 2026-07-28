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
        /value="goal-2"\s+checked/
    );

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
