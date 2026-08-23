import fs from "node:fs";
import path from "node:path";

const uiDir = "src/ui";
const files = fs.readdirSync(uiDir)
    .filter(name => /^Ai.*Controller\.js$/.test(name));

const patterns = [
    {
        from: "this.app.taskService?.repository?.getAll?.()",
        to: "this.app.taskService?.getAllTasks?.()"
    },
    {
        from: "this.app?.taskService?.repository?.getAll?.()",
        to: "this.app?.taskService?.getAllTasks?.()"
    }
];

let replacements = 0;
const changedFiles = [];

for (const name of files) {
    const filePath = path.join(uiDir, name);
    let source = fs.readFileSync(filePath, "utf8");
    const original = source;

    for (const { from, to } of patterns) {
        const parts = source.split(from);
        if (parts.length > 1) {
            replacements += parts.length - 1;
            source = parts.join(to);
        }
    }

    if (source !== original) {
        fs.writeFileSync(filePath, source, "utf8");
        changedFiles.push(filePath.replace(/\\/g, "/"));
    }
}

if (replacements === 0) {
    throw new Error("No se encontraron accesos directos de controladores de IA al repositorio de tareas.");
}

const testPath = "tests/AiServiceBoundary.test.js";
const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const uiDir = new URL("../src/ui/", import.meta.url);

function aiControllerFiles() {
    return fs.readdirSync(uiDir)
        .filter(name => /^Ai.*Controller\\.js$/.test(name));
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
`;

if (fs.existsSync(testPath)) {
    throw new Error(`${testPath} ya existe; abortando para no sobrescribirlo.`);
}
fs.writeFileSync(testPath, testContent, "utf8");

console.log(`OK: ${replacements} accesos migrados en ${changedFiles.length} controladores.`);
console.log(changedFiles.join("\n"));
