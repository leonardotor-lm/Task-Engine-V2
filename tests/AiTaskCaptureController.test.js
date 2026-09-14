import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { Dialog } from "../src/components/Dialog.js";
import {
    AiTaskCaptureController,
    parseTaskCaptureProposals
} from "../src/ui/AiTaskCaptureController.js";

test("parsea tareas válidas, elimina duplicados y descarta títulos vacíos", () => {
    const answer = JSON.stringify({
        tasks: [
            {
                title: "  Llamar   al plomero ",
                description: "Consultar disponibilidad."
            },
            {
                title: "llamar al plomero",
                description: "Duplicada."
            },
            {
                title: "Comprar materiales",
                description: "Para la clase del martes."
            },
            {
                title: "   ",
                description: "Sin título."
            }
        ]
    });

    assert.deepEqual(
        parseTaskCaptureProposals(answer),
        [
            {
                title: "Llamar al plomero",
                description: "Consultar disponibilidad.",
                dueDate: null,
                dueTime: null,
                priority: 0,
                areaId: null,
                contextId: null,
                tagIds: [],
                ambiguities: []
            },
            {
                title: "Comprar materiales",
                description: "Para la clase del martes.",
                dueDate: null,
                dueTime: null,
                priority: 0,
                areaId: null,
                contextId: null,
                tagIds: [],
                ambiguities: []
            }
        ]
    );
});

test("conserva metadatos claros y descarta referencias inexistentes", () => {
    const answer = JSON.stringify({
        tasks: [{
            title: "Pagar seguro del auto",
            description: "",
            dueDate: "2026-09-18",
            dueTime: "18:30",
            priority: 3,
            areaId: "area-personal",
            contextId: "context-casa",
            tagIds: ["tag-tramites", "tag-inventada"],
            ambiguities: ["No se indicó el medio de pago."]
        }]
    });

    assert.deepEqual(
        parseTaskCaptureProposals(answer, {
            areas: [{ id: "area-personal", name: "Personal" }],
            contexts: [{ id: "context-casa", name: "Casa" }],
            tags: [{ id: "tag-tramites", name: "Trámites" }]
        }),
        [{
            title: "Pagar seguro del auto",
            description: "",
            dueDate: "2026-09-18",
            dueTime: "18:30",
            priority: 3,
            areaId: "area-personal",
            contextId: "context-casa",
            tagIds: ["tag-tramites"],
            ambiguities: [
                "No se indicó el medio de pago.",
                "Se descartaron etiquetas que no existen en Task Engine."
            ]
        }]
    );
});

test("no conserva una hora aislada ni una fecha inválida", () => {
    const answer = JSON.stringify({
        tasks: [{
            title: "Llamar a Julia",
            dueDate: "2026-02-30",
            dueTime: "09:15"
        }]
    });

    const [proposal] = parseTaskCaptureProposals(answer);

    assert.equal(proposal.dueDate, null);
    assert.equal(proposal.dueTime, null);
    assert.deepEqual(proposal.ambiguities, [
        "Se descartó una fecha que no era válida.",
        "Se descartó la hora porque no había una fecha clara."
    ]);
});

test("limita una propuesta a diez tareas", () => {
    const answer = JSON.stringify({
        tasks: Array.from({ length: 12 }, (_, index) => ({
            title: `Tarea ${index + 1}`,
            description: ""
        }))
    });

    const parsed = parseTaskCaptureProposals(answer);
    assert.equal(parsed.length, 10);
    assert.equal(parsed[9].title, "Tarea 10");
});

test("rechaza respuestas con estructura inválida", () => {
    assert.throws(
        () => parseTaskCaptureProposals("texto sin json"),
        /formato inválido/
    );
    assert.throws(
        () => parseTaskCaptureProposals('{"proposals":[]}'),
        /formato inválido/
    );
});

test("crea sólo las tareas seleccionadas mediante TaskService después de confirmar", async () => {
    const created = [];
    let renders = 0;
    const controller = new AiTaskCaptureController(
        {
            taskService: {
                createTask(task) {
                    created.push(task);
                    return task;
                }
            },
            render() {
                renders += 1;
            }
        },
        { documentRef: null }
    );
    controller.sourceText = "Texto original";
    controller.proposal = {
        items: [
            {
                title: "Llamar al plomero",
                description: "Consultar disponibilidad.",
                selected: true
            },
            {
                title: "Comprar pintura",
                description: "",
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
                title: "Llamar al plomero",
                description: "Consultar disponibilidad.",
                dueDate: null,
                dueTime: null,
                priority: 0,
                areaId: null,
                contextId: null,
                tagIds: []
            }
        ]);
        assert.equal(controller.proposal, null);
        assert.equal(controller.sourceText, "");
        assert.equal(renders, 1);
    } finally {
        Dialog.confirmAsync = originalConfirm;
        Dialog.alert = originalAlert;
    }
});

test("una respuesta truncada no genera una propuesta aplicable", async () => {
    const controller = new AiTaskCaptureController(
        {
            aiPreferences: {
                isEnabled: () => true,
                getProvider: () => "gemini",
                getModel: () => "gemini-3.7-flash"
            },
            syncConfig: {
                isConfigured: () => true,
                get: () => ({ dbUrl: "url", token: "token" })
            },
            syncEngine: {
                gateway: {
                    aiQuery: async () => ({
                        ok: true,
                        answer: '{"tasks":[{"title":"Incompleta"',
                        truncated: true
                    })
                }
            }
        },
        { documentRef: null }
    );
    controller.sourceText = "Tengo que hacer algo";
    controller.renderDialog = () => {};

    const result = await controller.generate();

    assert.equal(result, null);
    assert.equal(controller.proposal, null);
    assert.match(controller.error, /incompleta|Intentá nuevamente/i);
});

test("main y PWA cablean la captura de tareas desde texto libre", () => {
    const main = fs.readFileSync(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const assets = fs.readFileSync(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(main, /AiTaskCaptureController/);
    assert.match(main, /aiTaskCaptureController\.start\(\);/);
    assert.match(assets, /AiTaskCaptureController\.js/);
});
