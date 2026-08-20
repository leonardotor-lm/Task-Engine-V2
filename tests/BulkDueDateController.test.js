import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    BulkDueDateController
} from "../src/ui/BulkDueDateController.js";
import { Dialog } from "../src/components/Dialog.js";

function createDocument() {

    const elements = new Map();
    const container = {
        appendChild(element) {
            elements.set(element.id, element);
        }
    };
    const dueDate = {
        closest(selector) {
            return selector === ".bulkControl"
                ? container
                : null;
        }
    };

    elements.set("bulkDueDate", dueDate);

    return {
        elements,
        getElementById(id) {
            return elements.get(id) ?? null;
        },
        createElement() {
            const listeners = new Map();

            return {
                id: "",
                type: "",
                className: "",
                textContent: "",
                attributes: new Map(),
                listeners,
                setAttribute(name, value) {
                    this.attributes.set(name, value);
                },
                addEventListener(type, handler) {
                    listeners.set(type, handler);
                }
            };
        }
    };

}

test("agrega Limpiar fecha a la selección múltiple y limpia fecha y hora", () => {

    const documentRef = createDocument();
    const applied = [];
    const alerts = [];
    const originalAlert = Dialog.alert;

    Dialog.alert = message => {
        alerts.push(message);
    };

    try {

        const app = {
            selectedTaskIds: new Set(["a", "b"]),
            taskService: {
                getTaskById() {
                    return { recurrence: null };
                }
            },
            mainView: {
                render() {},
                callbacks: {
                    onBulkUpdateTasks(data) {
                        applied.push(data);
                        return 2;
                    }
                }
            }
        };

        const controller =
            new BulkDueDateController(
                app,
                { documentRef }
            );

        controller.start();
        app.mainView.render();

        const button = documentRef
            .getElementById("bulkClearDueDate");

        assert.ok(button);
        assert.equal(
            button.textContent,
            "Limpiar fecha"
        );

        button.listeners.get("click")();

        assert.deepEqual(
            applied,
            [{ dueDate: null, dueTime: null }]
        );
        assert.match(
            alerts.at(-1),
            /Se limpió la fecha de 2 tareas/
        );

    } finally {
        Dialog.alert = originalAlert;
    }

});

test("no limpia la fecha si la selección contiene una tarea recurrente", () => {

    const alerts = [];
    const originalAlert = Dialog.alert;
    let updates = 0;

    Dialog.alert = message => {
        alerts.push(message);
    };

    try {

        const app = {
            selectedTaskIds: new Set(["recurrente"]),
            taskService: {
                getTaskById() {
                    return { recurrence: "WEEKLY" };
                }
            },
            mainView: {
                render() {},
                callbacks: {
                    onBulkUpdateTasks() {
                        updates += 1;
                        return 1;
                    }
                }
            }
        };

        const controller =
            new BulkDueDateController(
                app,
                { documentRef: createDocument() }
            );

        assert.equal(
            controller.clearSelectedDueDates(),
            0
        );
        assert.equal(updates, 0);
        assert.match(
            alerts.at(-1),
            /tarea recurrente/
        );

    } finally {
        Dialog.alert = originalAlert;
    }

});

test("el controlador se inicia y queda disponible en la PWA", async () => {

    const [main, assets] = await Promise.all([
        readFile(
            new URL("../src/main.js", import.meta.url),
            "utf8"
        ),
        readFile(
            new URL("../pwa-assets.js", import.meta.url),
            "utf8"
        )
    ]);

    assert.match(
        main,
        /BulkDueDateController/
    );
    assert.match(
        main,
        /bulkDueDateController\.start\(\)/
    );
    assert.match(
        assets,
        /src\/ui\/BulkDueDateController\.js/
    );

});
