import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";

test("ofrece mover desde el editor con búsqueda", () => {

    const task = new Task({
        id: "task-1",
        title: "Preparar clase"
    });

    const project = new Task({
        id: "project-1",
        title: "Proyecto escolar"
    });

    const html = new TaskEditor().render(
        task,
        [],
        [],
        [],
        [task, project],
        []
    );

    assert.match(html, /id="taskMoveTargetSearch"/);
    assert.match(html, /Proyecto escolar/);
    assert.match(html, /id="moveTaskFromEditor"/);

});

test("excluye la tarea sus descendientes y su padre actual", () => {

    const parent = new Task({
        id: "parent",
        title: "Proyecto actual"
    });

    const task = new Task({
        id: "task",
        title: "Tarea hija",
        parentTaskId: parent.id
    });

    const child = new Task({
        id: "child",
        title: "Descendiente",
        parentTaskId: task.id
    });

    const destination = new Task({
        id: "destination",
        title: "Otro proyecto"
    });

    const html = new TaskEditor().render(
        task,
        [],
        [],
        [],
        [
            parent,
            task,
            child,
            destination
        ],
        []
    );

    assert.doesNotMatch(
        html,
        /<option[\s\S]*value="parent"/
    );
    assert.doesNotMatch(
        html,
        /<option[\s\S]*value="child"/
    );
    assert.match(html, /Otro proyecto/);
    assert.match(
        html,
        /Convertir en tarea principal/
    );

});

test("no ofrece mover una tarea recurrente", () => {

    const recurring = new Task({
        id: "recurring",
        title: "Revisión semanal",
        dueDate: "2026-08-01",
        recurrence: "WEEKLY"
    });

    const destination = new Task({
        id: "destination",
        title: "Proyecto"
    });

    const html = new TaskEditor().render(
        recurring,
        [],
        [],
        [],
        [recurring, destination],
        []
    );

    assert.doesNotMatch(
        html,
        /id="moveTaskFromEditor"/
    );

});
