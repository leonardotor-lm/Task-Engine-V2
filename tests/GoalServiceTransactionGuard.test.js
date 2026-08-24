import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Goal } from "../src/domain/Goal.js";
import { Task } from "../src/domain/Task.js";
import { GoalService } from "../src/core/GoalService.js";
import { TaskService } from "../src/core/TaskService.js";
import {
    installGoalServiceTransactionGuard
} from "../src/core/GoalServiceTransactionGuard.js";
import {
    installTaskServiceTransactionGuard
} from "../src/core/TaskServiceTransactionGuard.js";
import {
    permanentlyDeleteGoalWithTaskCleanup
} from "../src/core/GoalTaskTransaction.js";

const appSource = await readFile(
    new URL("../src/core/App.js", import.meta.url),
    "utf8"
);

function createGoalRepository(
    goals,
    {
        failOnUpdate = null,
        failOnRemove = null
    } = {}
) {
    return {
        goals: [...goals],
        updateCount: 0,
        removeCount: 0,
        getAll() {
            return [...this.goals];
        },
        getById(id) {
            return this.goals.find(
                goal => goal.id === id
            ) ?? null;
        },
        update(goal) {
            this.updateCount += 1;
            const index = this.goals.findIndex(
                current => current.id === goal.id
            );
            this.goals[index] = goal;
            if (this.updateCount === failOnUpdate) {
                throw new Error(
                    "fallo simulado al actualizar objetivo"
                );
            }
        },
        remove(id) {
            this.removeCount += 1;
            this.goals = this.goals.filter(
                goal => goal.id !== id
            );
            if (this.removeCount === failOnRemove) {
                throw new Error(
                    "fallo simulado al eliminar objetivo"
                );
            }
        },
        replaceAll(nextGoals) {
            this.goals = [...nextGoals];
        }
    };
}

function createTaskRepository(tasks) {
    return {
        tasks: [...tasks],
        getAll() {
            return [...this.tasks];
        },
        getById(id) {
            return this.tasks.find(
                task => task.id === id
            ) ?? null;
        },
        updateMany(updated) {
            const replacements = new Map(
                updated.map(task => [task.id, task])
            );
            this.tasks = this.tasks.map(task =>
                replacements.get(task.id) ?? task
            );
        },
        replaceAll(nextTasks) {
            this.tasks = [...nextTasks];
        }
    };
}

function guardedGoalService(repository) {
    const service = new GoalService(repository);
    installGoalServiceTransactionGuard(service);
    return service;
}

test("restaura todo el árbol si falla enviarlo a papelera", () => {
    const root = new Goal({
        id: "root",
        title: "Objetivo principal"
    });
    const child = new Goal({
        id: "child",
        title: "Subobjetivo",
        parentGoalId: "root"
    });
    const repository = createGoalRepository(
        [root, child],
        { failOnUpdate: 2 }
    );
    const service = guardedGoalService(repository);

    assert.throws(
        () => service.deleteGoal("root"),
        /fallo simulado al actualizar objetivo/
    );

    assert.deepEqual(
        repository.getAll().map(goal => goal.status),
        ["ACTIVE", "ACTIVE"]
    );
});

test("restaura todo el árbol si falla el borrado definitivo", () => {
    const root = new Goal({
        id: "root",
        title: "Objetivo principal",
        status: "DELETED",
        statusBeforeDelete: "ACTIVE"
    });
    const child = new Goal({
        id: "child",
        title: "Subobjetivo",
        parentGoalId: "root",
        status: "DELETED",
        statusBeforeDelete: "ACTIVE"
    });
    const repository = createGoalRepository(
        [root, child],
        { failOnRemove: 2 }
    );
    const service = guardedGoalService(repository);

    assert.throws(
        () => service.permanentlyDeleteGoal("root"),
        /fallo simulado al eliminar objetivo/
    );

    assert.deepEqual(
        repository.getAll().map(goal => goal.id),
        ["root", "child"]
    );
});

test("conserva asociaciones de tareas si falla borrar objetivos", () => {
    const root = new Goal({
        id: "root",
        title: "Objetivo principal",
        status: "DELETED",
        statusBeforeDelete: "ACTIVE"
    });
    const goalRepository = createGoalRepository(
        [root],
        { failOnRemove: 1 }
    );
    const goalService = guardedGoalService(
        goalRepository
    );
    const taskRepository = createTaskRepository([
        new Task({
            id: "task",
            title: "Tarea vinculada",
            goalIds: ["root"]
        })
    ]);
    const taskService = new TaskService(
        taskRepository
    );
    installTaskServiceTransactionGuard(
        taskService
    );

    assert.throws(
        () => permanentlyDeleteGoalWithTaskCleanup(
            goalService,
            taskService,
            "root"
        ),
        /fallo simulado al eliminar objetivo/
    );

    assert.deepEqual(
        taskRepository.getById("task").goalIds,
        ["root"]
    );
    assert.notEqual(
        goalRepository.getById("root"),
        null
    );
});

test("instala el guard de objetivos antes de limpiar asociaciones", () => {
    const installation = appSource.indexOf(
        "installGoalServiceTransactionGuard(\n" +
        "            this.goalService"
    );
    const cleanup = appSource.indexOf(
        "removeMissingGoalAssociations"
    );

    assert.notEqual(installation, -1);
    assert.notEqual(cleanup, -1);
    assert.ok(installation < cleanup);
});

test("la PWA incluye las dos fronteras transaccionales", async () => {
    const assets = await readFile(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(
        assets,
        /GoalServiceTransactionGuard\.js/
    );
    assert.match(
        assets,
        /GoalTaskTransaction\.js/
    );
});
