import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { Dialog } from "../src/components/Dialog.js";
import { Task } from "../src/domain/Task.js";
import {
    AiPriorityApplyController
} from "../src/ui/AiPriorityApplyController.js";

test("aplica sólo propuestas seleccionadas mediante TaskService después de confirmar", async () => {
    let storedTasks = [
        new Task({ id: "a", title: "Tarea A", status: "PENDING", priority: 1 }),
        new Task({ id: "b", title: "Tarea B", status: "PENDING", priority: 2 })
    ];
    const updates = [];
    let renders = 0;
    const repository = {
        getById(id) {
            return storedTasks.find(task => task.id === id) || null;
        },
        getAll() {
            return [...storedTasks];
        },
        updateMany(tasks) {
            updates.push(...tasks.map(task => ({
                id: task.id,
                priority: task.priority
            })));
            const replacements = new Map(tasks.map(task => [task.id, task]));
            storedTasks = storedTasks.map(task => replacements.get(task.id) || task);
        },
        replaceAll(tasks) {
            storedTasks = [...tasks];
        }
    };
    const app = {
        taskService: {
            repository,
            activityService: null,
            getTaskById(id) {
                return repository.getById(id);
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
            { id: "a", priority: 3 }
        ]);
        assert.equal(repository.getById("a").priority, 3);
        assert.equal(repository.getById("b").priority, 2);
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

test("Aplicar IA queda cableado al controlador de propuestas y disponible en la PWA", async () => {
    const main = await fs.readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const pwaAssets = await fs.readFile(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(main, /AiPriorityApplyController/);
    assert.match(
        main,
        /new AiPriorityApplyController\([\s\S]*aiPriorityProposalController/
    );
    assert.match(main, /aiPriorityApplyController\.start\(\)/);
    assert.match(
        pwaAssets,
        /\.\/src\/ui\/AiPriorityApplyController\.js/
    );
});
