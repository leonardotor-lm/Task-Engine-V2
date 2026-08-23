import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const uiDir = new URL("../src/ui/", import.meta.url);

function aiControllerFiles() {
    return fs.readdirSync(uiDir)
        .filter(name => /^Ai.*Controller\.js$/.test(name));
}

test("los controladores de IA acceden a tareas mediante TaskService", () => {
    const violations = [];

    for (const name of aiControllerFiles()) {
        const source = fs.readFileSync(
            new URL(name, uiDir),
            "utf8"
        );

        if (
            source.includes("taskService?.repository") ||
            source.includes("taskService.repository")
        ) {
            violations.push(name);
        }
    }

    assert.deepEqual(
        violations,
        [],
        "Los controladores de IA no deben acceder directamente a taskService.repository"
    );
});

test("TaskService mantiene una API pública para listar tareas", () => {
    const source = fs.readFileSync(
        new URL("../src/core/TaskService.js", import.meta.url),
        "utf8"
    );

    assert.match(
        source,
        /getAllTasks\s*\(\s*\)/
    );
});
