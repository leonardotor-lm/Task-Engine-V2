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

test("la aplicación desvincula tareas antes de borrar los objetivos", () => {
    const start = appSource.indexOf(
        "onPermanentlyDeleteGoal: (id)"
    );
    const block = appSource.slice(
        start,
        start + 900
    );

    assert.ok(
        block.indexOf("removeGoalAssociations") <
        block.indexOf("permanentlyDeleteGoal")
    );
});
