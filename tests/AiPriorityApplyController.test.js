import test from "node:test";
import assert from "node:assert/strict";
import { Dialog } from "../src/components/Dialog.js";
import {
    AiPriorityApplyController
} from "../src/ui/AiPriorityApplyController.js";

test("aplica sólo propuestas seleccionadas mediante TaskService después de confirmar", async () => {
    const tasks = new Map([
        ["a", { id: "a", title: "Tarea A", status: "PENDING", priority: 1 }],
        ["b", { id: "b", title: "Tarea B", status: "PENDING", priority: 2 }]
    ]);
    const updates = [];
    let renders = 0;
    const app = {
        taskService: {
            getTaskById(id) {
                return tasks.get(id) || null;
            },
            updateTask(id, changes) {
                const task = tasks.get(id);
                Object.assign(task, changes);
                updates.push({ id, changes });
                return task;
            }
        },
        render() {
            renders += 1;
        }
    };
    const proposalController = {
        proposal: {
            items: [
                { taskId: "a", currentPriority: 1, priority: 3, selected: true },
                { taskId: "b", currentPriority: 2, priority: 4, selected: false }
            ]
        },
        error: "",
        renderDialog() {}
    };
    const controller = new AiPriorityApplyController(
        app,
        proposalController,
        { documentRef: null }
    );
    const originalConfirm = Dialog.confirmAsync;
    const originalAlert = Dialog.alert;
    Dialog.confirmAsync = async () => true;
    Dialog.alert = async () => true;

    try {
        const count = await controller.confirmAndApply();

        assert.equal(count, 1);
        assert.deepEqual(updates, [
            { id: "a", changes: { priority: 3 } }
        ]);
        assert.equal(tasks.get("a").priority, 3);
        assert.equal(tasks.get("b").priority, 2);
        assert.equal(proposalController.proposal, null);
        assert.equal(renders, 1);
    } finally {
        Dialog.confirmAsync = originalConfirm;
        Dialog.alert = originalAlert;
    }
});

test("rechaza una propuesta obsoleta si la prioridad cambió desde que se generó", () => {
    const app = {
        taskService: {
            getTaskById() {
                return {
                    id: "a",
                    title: "Tarea A",
                    status: "PENDING",
                    priority: 2
                };
            }
        }
    };
    const proposalController = {
        proposal: {
            items: [
                { taskId: "a", currentPriority: 1, priority: 3, selected: true }
            ]
        }
    };
    const controller = new AiPriorityApplyController(
        app,
        proposalController,
        { documentRef: null }
    );

    assert.throws(
        () => controller.validateSelectedItems(),
        /cambió desde que se generó la propuesta/
    );
});

test("rechaza IDs duplicados y prioridades fuera del rango permitido", () => {
    const app = {
        taskService: {
            getTaskById(id) {
                return {
                    id,
                    title: "Tarea",
                    status: "PENDING",
                    priority: 1
                };
            }
        }
    };

    const duplicateController = new AiPriorityApplyController(
        app,
        {
            proposal: {
                items: [
                    { taskId: "a", currentPriority: 1, priority: 2 },
                    { taskId: "a", currentPriority: 1, priority: 3 }
                ]
            }
        },
        { documentRef: null }
    );
    assert.throws(
        () => duplicateController.validateSelectedItems(),
        /inválida o duplicada/
    );

    const invalidPriorityController = new AiPriorityApplyController(
        app,
        {
            proposal: {
                items: [
                    { taskId: "a", currentPriority: 1, priority: 9 }
                ]
            }
        },
        { documentRef: null }
    );
    assert.throws(
        () => invalidPriorityController.validateSelectedItems(),
        /prioridad inválida/
    );
});
