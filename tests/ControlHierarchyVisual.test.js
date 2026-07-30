import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { GoalEditor } from "../src/ui/GoalEditor.js";
import { Sidebar } from "../src/ui/Sidebar.js";
import { Task } from "../src/domain/Task.js";
import { TaskEditor } from "../src/ui/TaskEditor.js";
import { View } from "../src/core/View.js";

const styles = fs.readFileSync(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("la interfaz define cuatro niveles reutilizables de acción", () => {
    for (const className of [
        "primaryAction",
        "secondaryAction",
        "tertiaryAction",
        "dangerAction"
    ]) {
        assert.match(
            styles,
            new RegExp(`\\.${className}`)
        );
    }

    assert.match(
        styles,
        /\.primaryAction\s*\{[\s\S]*?background:\s*var\(--color-accent\)/
    );
    assert.match(
        styles,
        /\.dangerAction:hover\s*\{[\s\S]*?var\(--color-danger-soft\)/
    );
});

test("el editor de tareas expresa una única acción primaria", () => {
    const html = new TaskEditor().render(new Task({
        id: "task-1",
        title: "Preparar clase",
        status: "PENDING",
        priority: 0,
        tagIds: [],
        goalIds: []
    }));

    assert.match(
        html,
        /id="saveTask"\s+class="primaryAction"/
    );
    assert.match(
        html,
        /id="toggleTask"\s+class="secondaryAction"/
    );
    assert.match(
        html,
        /id="archiveTask"\s+class="tertiaryAction"/
    );
    assert.match(
        html,
        /id="deleteTask"\s+class="dangerAction"/
    );
});

test("el editor de objetivos conserva la misma jerarquía", () => {
    const html = new GoalEditor().render({
        id: "goal-1",
        title: "Objetivo",
        description: "",
        status: "ACTIVE",
        dueDate: null
    });

    assert.match(
        html,
        /type="submit"\s+class="primaryAction"/
    );
    assert.match(
        html,
        /id="completeGoal"[\s\S]*?class="secondaryAction"/
    );
    assert.match(
        html,
        /id="archiveGoal"[\s\S]*?class="tertiaryAction"/
    );
});

test("la búsqueda lateral distingue lupa y acciones avanzadas", () => {
    const html = new Sidebar().render(
        View.TODAY,
        "prioridad:alta",
        [],
        null,
        [],
        [],
        {},
        "MANUAL",
        false,
        false,
        "",
        0,
        false,
        "",
        null,
        false,
        false,
        false,
        null,
        false,
        true
    );

    assert.match(
        html,
        /class="taskSearchSubmit iconButton"[\s\S]*?aria-label="Buscar tareas"/
    );
    assert.match(
        html,
        /id="advancedSearchForm"[\s\S]*?class="primaryAction"[\s\S]*?Aplicar/
    );
    assert.match(
        html,
        /id="saveCustomFilter"[\s\S]*?class="secondaryAction"/
    );
});
