import test from "node:test";
import assert from "node:assert/strict";

import {
    filterTasksByQuery,
    normalizeSearchText
} from "../src/core/TaskSearch.js";

const tasks = [
    {
        id: "1",
        title: "Preparar evaluación",
        description: "Literatura argentina"
    },
    {
        id: "2",
        title: "Corregir trabajos",
        description: "Tercer año"
    }
];

test("normaliza mayúsculas y tildes", () => {

    assert.equal(
        normalizeSearchText("  EVALUACIÓN  "),
        "evaluacion"
    );

});

test("busca por título", () => {

    const result = filterTasksByQuery(tasks, "preparar");

    assert.deepEqual(
        result.map(task => task.id),
        ["1"]
    );

});

test("busca por descripción ignorando tildes y mayúsculas", () => {

    const result = filterTasksByQuery(tasks, "LITERATURA ARGENTINA");

    assert.deepEqual(
        result.map(task => task.id),
        ["1"]
    );

});

test("devuelve todas las tareas cuando la búsqueda está vacía", () => {

    const result = filterTasksByQuery(tasks, "   ");

    assert.deepEqual(
        result.map(task => task.id),
        ["1", "2"]
    );

});

test("devuelve una lista vacía cuando no hay coincidencias", () => {

    const result = filterTasksByQuery(tasks, "inexistente");

    assert.deepEqual(result, []);

});
