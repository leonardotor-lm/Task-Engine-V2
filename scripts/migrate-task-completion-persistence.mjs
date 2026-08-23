import fs from "node:fs";

function read(path) {
    return fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

function replaceOnce(path, from, to) {
    const source = read(path);
    const count = source.split(from).length - 1;
    if (count !== 1) {
        throw new Error(
            `Se esperaba exactamente una coincidencia en ${path} y se encontraron ${count}.`
        );
    }
    fs.writeFileSync(path, source.replace(from, to), "utf8");
}

const taskPath = "src/domain/Task.js";

replaceOnce(
    taskPath,
    [
        "        this.statusBeforeCompletion = null;",
        "",
        "        this.isWaitingBeforeCompletion = null;"
    ].join("\n"),
    [
        "        this.statusBeforeCompletion =",
        "            data.statusBeforeCompletion ?? null;",
        "",
        "        this.isWaitingBeforeCompletion =",
        "            data.isWaitingBeforeCompletion ?? null;"
    ].join("\n")
);

replaceOnce(
    taskPath,
    "            statusBeforeDelete: this.statusBeforeDelete,",
    [
        "            statusBeforeDelete: this.statusBeforeDelete,",
        "",
        "            statusBeforeCompletion:",
        "                this.statusBeforeCompletion,",
        "",
        "            isWaitingBeforeCompletion:",
        "                this.isWaitingBeforeCompletion,"
    ].join("\n")
);

const testPath = "tests/TaskCompletionPersistence.test.js";
const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function serializeAndRestore(task) {
    return new Task(
        JSON.parse(JSON.stringify(task.toJSON()))
    );
}

test("deshacer completado de Inbox funciona después de serializar y reconstruir", () => {
    const task = new Task({
        id: "inbox-task",
        title: "Clasificar apuntes"
    });

    task.complete();
    const restored = serializeAndRestore(task);

    assert.equal(
        restored.statusBeforeCompletion,
        TaskStatus.INBOX
    );

    restored.undoCompletion();

    assert.equal(restored.status, TaskStatus.INBOX);
    assert.equal(restored.completedAt, null);
});

test("deshacer completado conserva En espera después de serializar y reconstruir", () => {
    const task = new Task({
        id: "waiting-task",
        title: "Esperar respuesta",
        status: TaskStatus.PENDING,
        isWaiting: true
    });

    task.complete();
    const restored = serializeAndRestore(task);

    assert.equal(
        restored.statusBeforeCompletion,
        TaskStatus.PENDING
    );
    assert.equal(restored.isWaitingBeforeCompletion, true);

    restored.undoCompletion();

    assert.equal(restored.status, TaskStatus.PENDING);
    assert.equal(restored.isWaiting, true);
    assert.equal(restored.completedAt, null);
});

test("tareas antiguas sin metadatos de completado siguen siendo compatibles", () => {
    const task = new Task({
        id: "legacy-task",
        title: "Tarea antigua",
        status: TaskStatus.COMPLETED,
        completedAt: "2026-08-22T12:00:00.000Z"
    });

    assert.equal(task.statusBeforeCompletion, null);
    assert.equal(task.isWaitingBeforeCompletion, null);

    task.undoCompletion();

    assert.equal(task.status, TaskStatus.INBOX);
    assert.equal(task.isWaiting, false);
});
`;

if (fs.existsSync(testPath)) {
    throw new Error(`${testPath} ya existe; abortando.`);
}
fs.writeFileSync(testPath, testContent, "utf8");

console.log("OK: estado previo al completado persistido correctamente.");
