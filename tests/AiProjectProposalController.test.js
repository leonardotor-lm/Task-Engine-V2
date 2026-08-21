import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { Dialog } from "../src/components/Dialog.js";
import {
    AiProjectProposalController,
    parseProjectProposals
} from "../src/ui/AiProjectProposalController.js";

test("parsea sólo propuestas válidas para tareas simples pendientes", () => {
    const tasks = [
        {
            id: "a",
            title: "Organizar mudanza",
            status: "PENDING",
            isProject: false,
            parentTaskId: null,
            recurrence: null,
            version: 4
        },
        {
            id: "b",
            title: "Proyecto existente",
            status: "PENDING",
            isProject: true,
            parentTaskId: null,
            recurrence: null,
            version: 2
        },
        {
            id: "c",
            title: "Tarea recurrente",
            status: "PENDING",
            isProject: false,
            parentTaskId: null,
            recurrence: "WEEKLY",
            version: 2
        }
    ];
    const answer = JSON.stringify({
        proposals: [
            {
                taskId: "a",
                reason: "Requiere varias acciones distintas.",
                subtasks: [
                    "Definir qué trasladar",
                    "Preparar cajas",
                    "Coordinar traslado"
                ]
            },
            {
                taskId: "b",
                reason: "Ya es proyecto.",
                subtasks: ["Uno", "Dos"]
            },
            {
                taskId: "c",
                reason: "Es recurrente.",
                subtasks: ["Uno", "Dos"]
            }
        ]
    });

    assert.deepEqual(
        parseProjectProposals(answer, tasks),
        [
            {
                taskId: "a",
                taskVersion: 4,
                subtaskTitles: [
                    "Definir qué trasladar",
                    "Preparar cajas",
                    "Coordinar traslado"
                ],
                reason: "Requiere varias acciones distintas."
            }
        ]
    );
});

test("rechaza propuestas con menos de dos o más de seis subtareas", () => {
    const tasks = [{
        id: "a",
        title: "Tarea compleja",
        status: "PENDING",
        isProject: false,
        parentTaskId: null,
        recurrence: null,
        version: 1
    }];

    assert.deepEqual(
        parseProjectProposals(
            JSON.stringify({
                proposals: [{
                    taskId: "a",
                    subtasks: ["Sólo una"]
                }]
            }),
            tasks
        ),
        []
    );

    assert.deepEqual(
        parseProjectProposals(
            JSON.stringify({
                proposals: [{
                    taskId: "a",
                    subtasks: [
                        "Uno", "Dos", "Tres", "Cuatro",
                        "Cinco", "Seis", "Siete"
                    ]
                }]
            }),
            tasks
        ),
        []
    );
});

test("crea subtareas sólo para propuestas seleccionadas después de confirmar", async () => {
    const parents = new Map([
        ["a", {
            id: "a",
            title: "Organizar mudanza",
            status: "PENDING",
            isProject: false,
            parentTaskId: null,
            recurrence: null,
            version: 3
        }],
        ["b", {
            id: "b",
            title: "Preparar viaje",
            status: "PENDING",
            isProject: false,
            parentTaskId: null,
            recurrence: null,
            version: 7
        }]
    ]);
    const children = new Map();
    const created = [];
    let renders = 0;
    const taskService = {
        getTaskById(id) {
            return parents.get(id) || null;
        },
        getDirectSubtasks(id) {
            return children.get(id) || [];
        },
        createSubtask(parentId, title) {
            const child = { parentTaskId: parentId, title };
            const list = children.get(parentId) || [];
            list.push(child);
            children.set(parentId, list);
            parents.get(parentId).isProject = true;
            created.push({ parentId, title });
            return child;
        }
    };
    const app = {
        taskService,
        render() {
            renders += 1;
        }
    };
    const controller = new AiProjectProposalController(
        app,
        { documentRef: null }
    );
    controller.proposal = {
        items: [
            {
                taskId: "a",
                taskVersion: 3,
                subtaskTitles: [
                    "Preparar cajas",
                    "Coordinar traslado"
                ],
                selected: true
            },
            {
                taskId: "b",
                taskVersion: 7,
                subtaskTitles: [
                    "Reservar alojamiento",
                    "Preparar equipaje"
                ],
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
        assert.deepEqual(created, [
            {
                parentId: "a",
                title: "Preparar cajas"
            },
            {
                parentId: "a",
                title: "Coordinar traslado"
            }
        ]);
        assert.equal(parents.get("a").isProject, true);
        assert.equal(parents.get("b").isProject, false);
        assert.equal(controller.proposal, null);
        assert.equal(renders, 1);
    } finally {
        Dialog.confirmAsync = originalConfirm;
        Dialog.alert = originalAlert;
    }
});

test("rechaza una propuesta si la tarea cambió desde que se generó", () => {
    const task = {
        id: "a",
        title: "Organizar mudanza",
        status: "PENDING",
        isProject: false,
        parentTaskId: null,
        recurrence: null,
        version: 6
    };
    const controller = new AiProjectProposalController(
        {
            taskService: {
                getTaskById() {
                    return task;
                },
                getDirectSubtasks() {
                    return [];
                }
            }
        },
        { documentRef: null }
    );
    controller.proposal = {
        items: [{
            taskId: "a",
            taskVersion: 5,
            subtaskTitles: ["Paso uno", "Paso dos"],
            selected: true
        }]
    };

    assert.throws(
        () => controller.validateSelectedItems(),
        /cambió desde que se generó/
    );
});

test("main y PWA cablean el controlador de propuestas de proyecto", () => {
    const main = fs.readFileSync(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const assets = fs.readFileSync(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(
        main,
        /AiProjectProposalController/
    );
    assert.match(
        main,
        /aiProjectProposalController\.start\(\);/
    );
    assert.match(
        assets,
        /AiProjectProposalController\.js/
    );
});
