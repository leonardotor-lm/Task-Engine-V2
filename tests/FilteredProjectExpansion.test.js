import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskList } from "../src/ui/TaskList.js";

function renderProject({
    expanded = false,
    searchQuery = "",
    filtersActive = false
} = {}) {

    const project = new Task({
        id: "project",
        title: "Proyecto coincidente"
    });
    const subtask = new Task({
        id: "subtask",
        title: "Subtarea coincidente",
        parentTaskId: project.id
    });

    return new TaskList().render(
        [project, subtask],
        "Todas",
        false,
        [],
        [],
        [],
        searchQuery,
        new Set(expanded ? [project.id] : []),
        filtersActive,
        new Set(),
        false,
        null,
        true,
        "2026-08-15",
        [project, subtask]
    );

}

test("una búsqueda conserva el proyecto contraído hasta usar la flecha", () => {

    const collapsed = renderProject({
        searchQuery: "coincidente"
    });
    const expanded = renderProject({
        searchQuery: "coincidente",
        expanded: true
    });

    assert.match(collapsed, /Expandir subtareas/);
    assert.doesNotMatch(collapsed, /Subtarea coincidente/);
    assert.match(expanded, /Contraer subtareas/);
    assert.match(expanded, /Subtarea coincidente/);

});

test("un filtro activo respeta la expansión elegida por el usuario", () => {

    const collapsed = renderProject({
        filtersActive: true
    });
    const expanded = renderProject({
        filtersActive: true,
        expanded: true
    });

    assert.match(collapsed, /Expandir subtareas/);
    assert.doesNotMatch(collapsed, /Subtarea coincidente/);
    assert.match(expanded, /Contraer subtareas/);
    assert.match(expanded, /Subtarea coincidente/);

});
