import test from "node:test";
import assert from "node:assert/strict";
import { Task } from "../src/domain/Task.js";
import {
    applyAtomicTaskUpdates
} from "../src/core/AtomicTaskUpdates.js";

function createRepository(task) {
    return {
        tasks: [task],
        getAll() {
            return [...this.tasks];
        },
        getById(id) {
            return this.tasks.find(item => item.id === id) ?? null;
        },
        updateMany(tasks) {
            const replacements = new Map(
                tasks.map(item => [item.id, item])
            );
            this.tasks = this.tasks.map(item =>
                replacements.get(item.id) ?? item
            );
        },
        replaceAll(tasks) {
            this.tasks = [...tasks];
        }
    };
}

test("el clon atómico conserva el estado previo al completado", () => {
    const task = new Task({
        id: "task-1",
        title: "Esperar respuesta",
        status: "PENDING",
        isWaiting: true
    });
    task.complete();

    const repository = createRepository(task);
    const service = {
        repository,
        activityService: {
            describeChanges() {
                return "Cambio de prioridad";
            },
            recordTask() {}
        }
    };

    const [updated] = applyAtomicTaskUpdates(service, [
        {
            id: task.id,
            changes: { priority: 3 }
        }
    ]);

    assert.equal(updated.statusBeforeCompletion, "PENDING");
    assert.equal(updated.isWaitingBeforeCompletion, true);

    updated.undoCompletion();

    assert.equal(updated.status, "PENDING");
    assert.equal(updated.isWaiting, true);
});
