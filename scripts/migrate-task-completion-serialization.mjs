import fs from "node:fs";

function read(path) {
    return fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

function replaceOnce(path, from, to) {
    const source = read(path);
    const count = source.split(from).length - 1;
    if (count !== 1) {
        throw new Error(`Se esperaba exactamente una coincidencia en ${path} y se encontraron ${count}.`);
    }
    fs.writeFileSync(path, source.replace(from, to), "utf8");
}

replaceOnce(
    "src/domain/Task.js",
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
    "src/domain/Task.js",
    [
        "            statusBeforeDelete: this.statusBeforeDelete,",
        "",
        "            areaId: this.areaId,"
    ].join("\n"),
    [
        "            statusBeforeDelete: this.statusBeforeDelete,",
        "",
        "            statusBeforeCompletion:",
        "                this.statusBeforeCompletion,",
        "",
        "            isWaitingBeforeCompletion:",
        "                this.isWaitingBeforeCompletion,",
        "",
        "            areaId: this.areaId,"
    ].join("\n")
);

const marker = 'test("no permite crear una tarea sin título", () => {';
const tests = [
    'test("serializar y reconstruir conserva el estado previo al completado", () => {',
    '',
    '    const task = new Task({',
    '        title: "Clasificar apuntes"',
    '    });',
    '',
    '    task.complete();',
    '',
    '    const restored = new Task(task.toJSON());',
    '    restored.undoCompletion();',
    '',
    '    assert.equal(restored.status, TaskStatus.INBOX);',
    '',
    '});',
    '',
    'test("serializar y reconstruir conserva la espera previa al completado", () => {',
    '',
    '    const task = new Task({',
    '        title: "Esperar respuesta",',
    '        status: TaskStatus.PENDING,',
    '        isWaiting: true',
    '    });',
    '',
    '    task.complete();',
    '',
    '    const serialized = task.toJSON();',
    '    assert.equal(serialized.statusBeforeCompletion, TaskStatus.PENDING);',
    '    assert.equal(serialized.isWaitingBeforeCompletion, true);',
    '',
    '    const restored = new Task(serialized);',
    '    restored.undoCompletion();',
    '',
    '    assert.equal(restored.status, TaskStatus.PENDING);',
    '    assert.equal(restored.isWaiting, true);',
    '',
    '});',
    '',
    marker
].join("\n");

replaceOnce("tests/Task.test.js", marker, tests);

console.log("OK: estado previo al completado preservado al serializar y reconstruir.");
