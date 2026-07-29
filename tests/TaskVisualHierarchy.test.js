import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

const styles = await readFile(
    new URL(
        "../styles.css",
        import.meta.url
    ),
    "utf8"
);

test("distingue proyectos y subtareas en la lista", () => {

    const project = new Task({
        id: "project",
        title: "Proyecto"
    });

    const subtask = new Task({
        id: "subtask",
        title: "Subtarea",
        parentTaskId: project.id
    });

    const html = new TaskList().render(
        [project, subtask],
        "Tareas",
        false,
        [],
        [],
        [],
        "",
        new Set([project.id])
    );

    assert.match(
        html,
        /class="task\s+projectTask/
    );

    assert.match(
        html,
        /class="task subtask/
    );

});

test("usa espaciado y jerarquía en lugar de cajas", () => {

    assert.match(
        styles,
        /\/\* Jerarquía visual de las listas \*\//
    );

    assert.match(
        styles,
        /\.task\.subtask[\s\S]*?border-left: 0/
    );

    assert.match(
        styles,
        /\.projectTask \.taskTitle[\s\S]*?font-weight: 600/
    );

    assert.match(
        styles,
        /\.priority-4[\s\S]*?color: #b42318/
    );

});
