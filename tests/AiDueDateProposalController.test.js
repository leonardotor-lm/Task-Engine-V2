import test from "node:test";
import assert from "node:assert/strict";
import { Dialog } from "../src/components/Dialog.js";
import {
    AiDueDateProposalController,
    parseDueDateProposals
} from "../src/ui/AiDueDateProposalController.js";

test("parsea sólo propuestas de fecha válidas para tareas pendientes sin vencimiento", () => {
    const tasks = [
        {
            id: "a",
            title: "Tarea A",
            status: "PENDING",
            dueDate: null,
            startDate: "2099-01-10"
        },
        {
            id: "b",
            title: "Tarea B",
            status: "PENDING",
            dueDate: "2099-01-20",
            startDate: null
        }
    ];
    const answer = JSON.stringify({
        proposals: [
            {
                taskId: "a",
                dueDate: "2099-01-12",
                reason: "Conviene resolverla pronto."
            },
            {
                taskId: "b",
                dueDate: "2099-01-22",
                reason: "Ya tiene fecha."
            },
            {
                taskId: "a",
                dueDate: "2099-01-13",
                reason: "Duplicada."
            },
            {
                taskId: "inexistente",
                dueDate: "2099-01-14",
                reason: "ID inválido."
            }
        ]
    });

    assert.deepEqual(
        parseDueDateProposals(
            answer,
            tasks,
            "2099-01-01"
        ),
        [
            {
                taskId: "a",
                currentDueDate: null,
                dueDate: "2099-01-12",
                reason: "Conviene resolverla pronto."
            }
        ]
    );
});

test("descarta fechas anteriores a hoy o a la fecha de inicio", () => {
    const tasks = [
        {
            id: "a",
            title: "Tarea A",
            status: "PENDING",
            dueDate: null,
            startDate: "2099-01-10"
        }
    ];

    assert.deepEqual(
        parseDueDateProposals(
            JSON.stringify({
                proposals: [
                    {
                        taskId: "a",
                        dueDate: "2099-01-09",
                        reason: "Demasiado temprano."
                    }
                ]
            }),
            tasks,
            "2099-01-01"
        ),
        []
    );

    assert.deepEqual(
        parseDueDateProposals(
            JSON.stringify({
                proposals: [
                    {
                        taskId: "a",
                        dueDate: "2098-12-31",
                        reason: "Fecha pasada."
                    }
                ]
            }),
            tasks,
            "2099-01-01"
        ),
        []
    );
});

test("aplica sólo fechas seleccionadas mediante TaskService después de confirmar", async () => {
    const tasks = new Map([
        ["a", {
            id: "a",
            title: "Tarea A",
            status: "PENDING",
            dueDate: null,
            startDate: null
        }],
        ["b", {
            id: "b",
            title: "Tarea B",
            status: "PENDING",
            dueDate: null,
            startDate: null
        }]
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
    const controller = new AiDueDateProposalController(
        app,
        { documentRef: null }
    );
    controller.proposal = {
        items: [
            {
                taskId: "a",
                currentDueDate: null,
                dueDate: "2099-01-12",
                selected: true
            },
            {
                taskId: "b",
                currentDueDate: null,
                dueDate: "2099-01-15",
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
                changes: { dueDate: "2099-01-12" }
            }
        ]);
        assert.equal(
            tasks.get("a").dueDate,
            "2099-01-12"
        );
        assert.equal(tasks.get("b").dueDate, null);
        assert.equal(controller.proposal, null);
        assert.equal(renders, 1);
    } finally {
        Dialog.confirmAsync = originalConfirm;
        Dialog.alert = originalAlert;
    }
});

test("rechaza una propuesta obsoleta si la tarea recibió fecha antes de aplicar", () => {
    const app = {
        taskService: {
            getTaskById() {
                return {
                    id: "a",
                    title: "Tarea A",
                    status: "PENDING",
                    dueDate: "2099-01-11",
                    startDate: null
                };
            }
        }
    };
    const controller = new AiDueDateProposalController(
        app,
        { documentRef: null }
    );
    controller.proposal = {
        items: [
            {
                taskId: "a",
                currentDueDate: null,
                dueDate: "2099-01-12",
                selected: true
            }
        ]
    };

    assert.throws(
        () => controller.validateSelectedItems(),
        /ya tiene una fecha de vencimiento/
    );
});
