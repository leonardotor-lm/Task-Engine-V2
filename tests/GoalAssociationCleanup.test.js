import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";

const appSource = await readFile(
    new URL("../src/core/App.js", import.meta.url),
    "utf8"
);

test("quita objetivos eliminados sin borrar ni alterar las tareas", () => {
    const original = new Task({
        id: "task-1",
        title: "Preparar clase",
        description: "Conservar contenido",
        areaId: "area-1",
        tagIds: ["tag-1"],
        goalIds: [
            "goal-parent",
            "goal-child",
            "goal-kept"
        ]
    });
    let tasks = [original];
    const repository = {
        getAll: () => tasks,
        updateMany: updated => {
            tasks = updated;
        }
    };
    const service = new TaskService(repository);

    const updated = service.removeGoalAssociations([
        "goal-parent",
        "goal-child"
    ]);

    assert.equal(updated.length, 1);
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].id, original.id);
    assert.equal(tasks[0].title, original.title);
    assert.equal(
        tasks[0].description,
        original.description
    );
    assert.equal(tasks[0].areaId, "area-1");
    assert.deepEqual(tasks[0].tagIds, ["tag-1"]);
    assert.deepEqual(
        tasks[0].goalIds,
        ["goal-kept"]
    );
});

test("no escribe cuando ninguna tarea usa esos objetivos", () => {
    let writes = 0;
    const service = new TaskService({
        getAll: () => [
            new Task({
                title: "Sin asociación",
                goalIds: ["goal-kept"]
            })
        ],
        updateMany: () => {
            writes += 1;
        }
    });

    assert.deepEqual(
        service.removeGoalAssociations([
            "goal-removed"
        ]),
        []
    );
    assert.equal(writes, 0);
});

test("la aplicación borra objetivos y asociaciones en una transacción", () => {
    const start = appSource.indexOf(
        "onPermanentlyDeleteGoal: (id)"
    );
    const block = appSource.slice(
        start,
        start + 900
    );

    assert.match(
        block,
        /permanentlyDeleteGoalWithTaskCleanup\(\s*this\.goalService,\s*this\.taskService,\s*id\s*\)/
    );
});

test("repara referencias históricas y conserva objetivos válidos", () => {
    const linked = new Task({
        id: "task-linked",
        title: "Tarea con historial",
        goalIds: ["goal-valid", "goal-missing"]
    });
    const unaffected = new Task({
        id: "task-unaffected",
        title: "Tarea válida",
        goalIds: ["goal-valid"]
    });
    let updatedTasks = [];
    const service = new TaskService({
        getAll: () => [linked, unaffected],
        updateMany: tasks => {
            updatedTasks = tasks;
        }
    });

    const repaired =
        service.removeMissingGoalAssociations([
            "goal-valid"
        ]);

    assert.equal(repaired.length, 1);
    assert.equal(updatedTasks.length, 1);
    assert.equal(
        updatedTasks[0].id,
        linked.id
    );
    assert.deepEqual(
        updatedTasks[0].goalIds,
        ["goal-valid"]
    );
    assert.deepEqual(
        unaffected.goalIds,
        ["goal-valid"]
    );
});

test("la aplicación repara asociaciones al iniciar", () => {
    const cleanup = appSource.indexOf(
        "removeMissingGoalAssociations"
    );
    const backup = appSource.indexOf(
        "this.backupService = new BackupService"
    );

    assert.notEqual(cleanup, -1);
    assert.ok(cleanup < backup);
});
