import test from "node:test";
import assert from "node:assert/strict";
import { Dialog } from "../src/components/Dialog.js";
import {
    createAtomicTaskServiceFixture
} from "./helpers/AtomicTaskServiceFixture.js";
import {
    AiWaitingProposalController,
    parseWaitingProposals
} from "../src/ui/AiWaitingProposalController.js";

test("parsea sólo propuestas válidas para tareas pendientes que no están En espera", () => {
    const tasks = [
        {
            id: "a",
            title: "Tarea A",
            status: "PENDING",
            isWaiting: false
        },
        {
            id: "b",
            title: "Tarea B",
            status: "PENDING",
            isWaiting: true
        },
        {
            id: "c",
            title: "Tarea C",
            status: "COMPLETED",
            isWaiting: false
        }
    ];
    const answer = JSON.stringify({
        proposals: [
            {
                taskId: "a",
                reason: "Depende de una condición externa."
            },
            {
                taskId: "b",
                reason: "Ya está En espera."
            },
            {
                taskId: "a",
                reason: "Duplicada."
            },
            {
                taskId: "inexistente",
                reason: "ID inválido."
            },
            {
                taskId: "c",
                reason: "No está pendiente."
            }
        ]
    });

    assert.deepEqual(
        parseWaitingProposals(answer, tasks),
        [
            {
                taskId: "a",
                currentIsWaiting: false,
                isWaiting: true,
                reason: "Depende de una condición externa."
            }
        ]
    );
});

test("aplica sólo propuestas seleccionadas mediante TaskService después de confirmar", async () => {
    const {
        tasks,
        updates,
        taskService
    } = createAtomicTaskServiceFixture([
        {
            id: "a",
            title: "Tarea A",
            status: "PENDING",
            isWaiting: false
        },
        {
            id: "b",
            title: "Tarea B",
            status: "PENDING",
            isWaiting: false
        }
    ]);
    let renders = 0;
    const app = {
        taskService,
        render() {
            renders += 1;
        }
    };
    const controller = new AiWaitingProposalController(
        app,
        { documentRef: null }
    );
    controller.proposal = {
        items: [
            {
                taskId: "a",
                currentIsWaiting: false,
                isWaiting: true,
                selected: true
            },
            {
                taskId: "b",
                currentIsWaiting: false,
                isWaiting: true,
                selected: false
            }
        ]
    };

    const originalConfirm = Dialog.confirmAsync;
    const originalAlert = Dialog.alert;
    Dialog.confirmAsync = async () => true;
    Dialog.alert = async () => true;

    try {
        const count = await controller.confirmAndApply();

        assert.equal(count, 1);
        assert.deepEqual(updates, [
            {
                id: "a",
                changes: { isWaiting: true }
            }
        ]);
        assert.equal(tasks.get("a").isWaiting, true);
        assert.equal(tasks.get("b").isWaiting, false);
        assert.equal(controller.proposal, null);
        assert.equal(renders, 1);
    } finally {
        Dialog.confirmAsync = originalConfirm;
        Dialog.alert = originalAlert;
    }
});

test("rechaza una propuesta obsoleta si la tarea ya pasó a En espera", () => {
    const app = {
        taskService: {
            getTaskById() {
                return {
                    id: "a",
                    title: "Tarea A",
                    status: "PENDING",
                    isWaiting: true
                };
            }
        }
    };
    const controller = new AiWaitingProposalController(
        app,
        { documentRef: null }
    );
    controller.proposal = {
        items: [
            {
                taskId: "a",
                currentIsWaiting: false,
                isWaiting: true,
                selected: true
            }
        ]
    };

    assert.throws(
        () => controller.validateSelectedItems(),
        /ya está En espera/
    );
});

test("rechaza una propuesta obsoleta si la tarea dejó de estar pendiente", () => {
    const app = {
        taskService: {
            getTaskById() {
                return {
                    id: "a",
                    title: "Tarea A",
                    status: "COMPLETED",
                    isWaiting: false
                };
            }
        }
    };
    const controller = new AiWaitingProposalController(
        app,
        { documentRef: null }
    );
    controller.proposal = {
        items: [
            {
                taskId: "a",
                currentIsWaiting: false,
                isWaiting: true,
                selected: true
            }
        ]
    };

    assert.throws(
        () => controller.validateSelectedItems(),
        /ya no está pendiente/
    );
});
