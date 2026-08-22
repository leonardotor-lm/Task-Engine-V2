import test from "node:test";
import assert from "node:assert/strict";
import { Dialog } from "../src/components/Dialog.js";
import {
    createAtomicTaskServiceFixture
} from "./helpers/AtomicTaskServiceFixture.js";
import {
    AiOrganizationProposalController,
    parseOrganizationProposals
} from "../src/ui/AiOrganizationProposalController.js";

test("acepta sólo IDs existentes y conserva etiquetas previas como snapshot", () => {
    const tasks = [
        {
            id: "task-a",
            title: "Comprar repuesto",
            status: "PENDING",
            areaId: "area-a",
            contextId: null,
            tagIds: ["tag-a"]
        }
    ];
    const entities = {
        areas: [
            { id: "area-a", name: "Casa" },
            { id: "area-b", name: "Auto" }
        ],
        contexts: [
            { id: "context-a", name: "Teléfono" }
        ],
        tags: [
            { id: "tag-a", name: "Compra" },
            { id: "tag-b", name: "Importante" }
        ]
    };

    const proposals = parseOrganizationProposals(
        JSON.stringify({
            proposals: [
                {
                    taskId: "task-a",
                    areaId: "area-b",
                    contextId: "context-a",
                    addTagIds: ["tag-a", "tag-b"],
                    reason: "Corresponde al auto y requiere una llamada."
                }
            ]
        }),
        tasks,
        entities
    );

    assert.deepEqual(proposals, [
        {
            taskId: "task-a",
            currentAreaId: "area-a",
            currentContextId: null,
            currentTagIds: ["tag-a"],
            areaId: "area-b",
            contextId: "context-a",
            addTagIds: ["tag-b"],
            reason: "Corresponde al auto y requiere una llamada."
        }
    ]);
});

test("descarta propuestas sin cambios o con entidades inventadas", () => {
    const tasks = [
        {
            id: "task-a",
            title: "Tarea",
            status: "PENDING",
            areaId: "area-a",
            contextId: "context-a",
            tagIds: ["tag-a"]
        }
    ];
    const entities = {
        areas: [{ id: "area-a", name: "Casa" }],
        contexts: [{ id: "context-a", name: "PC" }],
        tags: [{ id: "tag-a", name: "Etiqueta" }]
    };

    assert.deepEqual(
        parseOrganizationProposals(
            JSON.stringify({
                proposals: [
                    {
                        taskId: "task-a",
                        areaId: "area-a",
                        contextId: "context-a",
                        addTagIds: ["tag-a"],
                        reason: "No cambia nada."
                    }
                ]
            }),
            tasks,
            entities
        ),
        []
    );

    assert.deepEqual(
        parseOrganizationProposals(
            JSON.stringify({
                proposals: [
                    {
                        taskId: "task-a",
                        areaId: "inventada",
                        reason: "Área inexistente."
                    }
                ]
            }),
            tasks,
            entities
        ),
        []
    );
});

test("aplica el paquete seleccionado mediante TaskService después de confirmar", async () => {
    const {
        tasks,
        updates,
        taskService
    } = createAtomicTaskServiceFixture([
        {
            id: "task-a",
            title: "Comprar repuesto",
            status: "PENDING",
            areaId: "area-a",
            contextId: null,
            tagIds: ["tag-a"]
        }
    ]);
    const task = tasks.get("task-a");
    let renders = 0;
    const app = {
        taskService,
        areaService: {
            getAllAreas() {
                return [
                    { id: "area-a", name: "Casa" },
                    { id: "area-b", name: "Auto" }
                ];
            }
        },
        contextService: {
            getAllContexts() {
                return [{ id: "context-a", name: "Teléfono" }];
            }
        },
        tagService: {
            getAllTags() {
                return [
                    { id: "tag-a", name: "Compra" },
                    { id: "tag-b", name: "Importante" }
                ];
            }
        },
        render() {
            renders += 1;
        }
    };
    const controller = new AiOrganizationProposalController(
        app,
        { documentRef: null }
    );
    controller.proposal = {
        items: [
            {
                taskId: "task-a",
                currentAreaId: "area-a",
                currentContextId: null,
                currentTagIds: ["tag-a"],
                areaId: "area-b",
                contextId: "context-a",
                addTagIds: ["tag-b"],
                selected: true
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
                id: "task-a",
                changes: {
                    areaId: "area-b",
                    contextId: "context-a",
                    tagIds: ["tag-a", "tag-b"]
                }
            }
        ]);
        assert.equal(task.areaId, "area-b");
        assert.equal(task.contextId, "context-a");
        assert.deepEqual(task.tagIds, ["tag-a", "tag-b"]);
        assert.equal(controller.proposal, null);
        assert.equal(renders, 1);
    } finally {
        Dialog.confirmAsync = originalConfirm;
        Dialog.alert = originalAlert;
    }
});

test("rechaza una propuesta obsoleta si cambió la organización de la tarea", () => {
    const app = {
        taskService: {
            getTaskById() {
                return {
                    id: "task-a",
                    title: "Tarea",
                    status: "PENDING",
                    areaId: "area-c",
                    contextId: null,
                    tagIds: []
                };
            }
        },
        areaService: {
            getAllAreas() {
                return [
                    { id: "area-a", name: "Casa" },
                    { id: "area-b", name: "Trabajo" },
                    { id: "area-c", name: "Personal" }
                ];
            }
        },
        contextService: { getAllContexts: () => [] },
        tagService: { getAllTags: () => [] }
    };
    const controller = new AiOrganizationProposalController(
        app,
        { documentRef: null }
    );
    controller.proposal = {
        items: [
            {
                taskId: "task-a",
                currentAreaId: "area-a",
                currentContextId: null,
                currentTagIds: [],
                areaId: "area-b",
                selected: true
            }
        ]
    };

    assert.throws(
        () => controller.validateSelectedItems(),
        /cambió su organización/
    );
});
