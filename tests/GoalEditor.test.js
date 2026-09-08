import test from "node:test";
import assert from "node:assert/strict";

import { Goal } from "../src/domain/Goal.js";
import { Task } from "../src/domain/Task.js";
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
        /<summary>\s*Organización\s*<\/summary>/
    );

});

test("mantiene la organización bajo demanda", () => {

    const parent = new Goal({
        id: "parent",
        title: "Principal"
    });

    const child = new Goal({
        id: "child",
        title: "Secundario",
        parentGoalId: parent.id
    });

    const html = new GoalEditor().render(
        child,
        [parent, child]
    );

    assert.match(
        html,
        /<details class="goalHierarchySection goalEditorTool">/
    );
    assert.doesNotMatch(
        html,
        /<details class="goalHierarchySection goalEditorTool"\s+open/
    );

});

test("ordena la información las herramientas y el pie como el editor de tareas", () => {

    const parent = new Goal({
        id: "parent",
        title: "Principal"
    });
    const child = new Goal({
        id: "child",
        title: "Secundario",
        parentGoalId: parent.id
    });

    const html = new GoalEditor().render(
        parent,
        [parent, child]
    );

    assert.match(
        html,
        /class="goalEditorPrimary"[\s\S]*class="goalEditorPlanning"[\s\S]*class="goalEditorToolGrid"[\s\S]*class="goalEditorFooter"/
    );
    assert.match(
        html,
        /data-goal-tool-order="Notas,Asociaciones,Subobjetivos,Organización"/
    );
    assert.match(
        html,
        /class="goalEditorAdministrativeActions"[\s\S]*id="archiveGoal"[\s\S]*id="deleteGoalFromEditor"/
    );
    assert.match(
        html,
        /class="goalEditorPrimaryActions"[\s\S]*id="completeGoal"[\s\S]*Guardar cambios/
    );
    assert.match(
        html,
        /<span>Subobjetivos<\/span>[\s\S]*class="goalEditorToolCount">\s*1/
    );

});

test("administra las asociaciones desde el editor", () => {

    const goal = new Goal({
        id: "goal-1",
        title: "Publicar un libro"
    });

    const associated = new Task({
        id: "task-1",
        title: "Corregir manuscrito",
        goalIds: [goal.id]
    });

    const available = new Task({
        id: "task-2",
        title: "Buscar editorial"
    });

    const html = new GoalEditor().render(
        goal,
        [goal],
        [associated, available]
    );

    assert.match(
        html,
        /Gestionar asociaciones/
    );
    assert.match(html, /Corregir manuscrito/);
    assert.match(
        html,
        /id="goalTaskDetachForm"/
    );
    assert.match(html, /id="goalTaskForm"/);
    assert.match(html, /type="search"/);
    assert.match(html, /Buscar editorial/);

});

test("los paneles de herramientas son exclusivos y recuperan el foco", t => {

    const previousDocument = globalThis.document;
    const documentListeners = new Map();

    const createTool = () => {

        const listeners = new Map();
        const summary = {
            focused: false,
            focus() { this.focused = true; }
        };
        const close = {
            addEventListener(type, handler) {
                listeners.set(`close:${type}`, handler);
            }
        };

        return {
            open: false,
            listeners,
            summary,
            close,
            addEventListener(type, handler) {
                listeners.set(type, handler);
            },
            querySelector(selector) {
                return selector === ":scope > summary"
                    ? summary
                    : close;
            },
            contains() { return false; }
        };

    };

    const first = createTool();
    const second = createTool();

    globalThis.document = {
        querySelector() {
            return {
                querySelectorAll() {
                    return [first, second];
                }
            };
        },
        addEventListener(type, handler) {
            documentListeners.set(type, handler);
        }
    };

    t.after(() => {
        globalThis.document = previousDocument;
    });

    new GoalEditor().bindToolPanels();

    first.open = true;
    second.open = true;
    first.listeners.get("toggle")();

    assert.equal(first.open, true);
    assert.equal(second.open, false);

    first.listeners.get("close:click")({
        preventDefault() {},
        stopPropagation() {}
    });

    assert.equal(first.open, false);
    assert.equal(first.summary.focused, true);

});
