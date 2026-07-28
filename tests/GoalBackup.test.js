import test from "node:test";
import assert from "node:assert/strict";

import { BackupService } from "../src/core/BackupService.js";
import { GoalRepository } from "../src/infrastructure/GoalRepository.js";

function storage() {

    const values = new Map();

    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) =>
            values.set(key, String(value)),
        removeItem: key => values.delete(key)
    };

}

function repository(items = []) {
    return {
        getAll: () => [...items],
        replaceAll: next => {
            items.splice(0, items.length, ...next);
        }
    };
}

function service(goalRepository) {
    return new BackupService({
        taskRepository: repository(),
        areaRepository: repository(),
        contextRepository: repository(),
        tagRepository: repository(),
        customFilterRepository: repository(),
        goalRepository,
        storage: storage()
    });
}

test("incluye objetivos en la copia", () => {

    globalThis.localStorage = storage();

    const goals = new GoalRepository();
    goals.add({ title: "Objetivo anual" });

    const backup = service(goals).createBackup();

    assert.equal(backup.data.goals.length, 1);
    assert.equal(
        backup.data.goals[0].title,
        "Objetivo anual"
    );

});

test("acepta copias antiguas sin objetivos", () => {

    const backupService = service(repository());
    const backup = backupService.createBackup();

    delete backup.data.goals;

    const data = backupService.parseAndValidate(
        JSON.stringify(backup)
    );

    assert.deepEqual(data.goals, []);

});

test("rechaza padres inexistentes y ciclos", () => {

    const backupService = service(repository());
    const backup = backupService.createBackup();

    backup.data.goals = [{
        id: "child",
        title: "Huérfano",
        parentGoalId: "missing"
    }];

    assert.throws(
        () => backupService.parseAndValidate(
            JSON.stringify(backup)
        ),
        /objetivo principal inexistente/
    );

    backup.data.goals = [
        {
            id: "a",
            title: "A",
            parentGoalId: "b"
        },
        {
            id: "b",
            title: "B",
            parentGoalId: "a"
        }
    ];

    assert.throws(
        () => backupService.parseAndValidate(
            JSON.stringify(backup)
        ),
        /ciclo en la jerarquía de objetivos/
    );

});
