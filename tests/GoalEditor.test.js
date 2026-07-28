import test from "node:test";
import assert from "node:assert/strict";

import { Goal } from "../src/domain/Goal.js";
import { GoalEditor } from "../src/ui/GoalEditor.js";

test("no reserva espacio sin un objetivo", () => {

    assert.equal(
        new GoalEditor().render(null),
        ""
    );

});

test("muestra los datos y acciones del objetivo", () => {

    const html = new GoalEditor().render(
        new Goal({
            title: "Publicar un libro",
            description: "Preparar el manuscrito",
            dueDate: "2027-03-01"
        })
    );

    assert.match(html, /Publicar un libro/);
    assert.match(html, /Preparar el manuscrito/);
    assert.match(html, /2027-03-01/);
    assert.match(html, /id="completeGoal"/);
    assert.match(html, /id="archiveGoal"/);
    assert.match(
        html,
        /id="deleteGoalFromEditor"/
    );
    assert.match(html, /id="subgoalForm"/);
    assert.match(html, /id="subgoalTitle"/);

});

test("escapa el contenido del objetivo", () => {

    const html = new GoalEditor().render(
        new Goal({
            title: "<script>Meta</script>",
            description: "<img src=x>"
        })
    );

    assert.doesNotMatch(html, /<script>/);
    assert.doesNotMatch(html, /<img/);

});

test("permite mover e independizar un subobjetivo", () => {

    const parent = new Goal({
        id: "parent",
        title: "Principal"
    });

    const child = new Goal({
        title: "Subobjetivo",
        parentGoalId: parent.id
    });

    const html = new GoalEditor().render(
        child,
        [parent, child]
    );

    assert.match(html, /id="goalParentForm"/);
    assert.match(html, /id="detachGoal"/);

});

test("oculta Organización cuando no hay acciones disponibles", () => {

    const goal = new Goal({
        id: "only-goal",
        title: "Objetivo único"
    });

    const html = new GoalEditor().render(
        goal,
        [goal]
    );

    assert.doesNotMatch(
        html,
        /<h4>Organización<\/h4>/
    );

});
