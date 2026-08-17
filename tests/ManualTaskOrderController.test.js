import test from "node:test";
import assert from "node:assert/strict";
import {
    ManualTaskOrderController
} from "../src/ui/ManualTaskOrderController.js";

function createDocument() {
    const listeners = new Map();

    return {
        listeners,
        createElement() {
            return {};
        },
        querySelectorAll() {
            return [];
        },
        addEventListener(type, handler, capture) {
            listeners.set(type, {
                handler,
                capture
            });
        },
        removeEventListener(type, handler, capture) {
            const current = listeners.get(type);

            if (
                current?.handler === handler &&
                current.capture === capture
            ) {
                listeners.delete(type);
            }
        }
    };
}

function createApp(overrides = {}) {
    return {
        taskSort: "MANUAL",
        searchQuery: "",
        advancedSearchMode: false,
        taskFilters: {
            areaId: "",
            contextId: "",
            tagId: "",
            priority: "",
            due: ""
        },
        bulkSelectionMode: false,
        mainView: {
            render() {}
        },
        ...overrides
    };
}

test("habilita el arrastre sólo con orden manual limpio", () => {
    const controller =
        new ManualTaskOrderController(
            createApp(),
            {
                documentRef: createDocument()
            }
        );

    assert.equal(
        controller.canReorder(),
        true
    );
});

test("deshabilita el arrastre con otro orden", () => {
    const controller =
        new ManualTaskOrderController(
            createApp({
                taskSort: "PRIORITY"
            }),
            {
                documentRef: createDocument()
            }
        );

    assert.equal(
        controller.canReorder(),
        false
    );
});

test("deshabilita el arrastre con búsqueda o filtros", () => {
    const withSearch =
        new ManualTaskOrderController(
            createApp({
                searchQuery: "informe"
            }),
            {
                documentRef: createDocument()
            }
        );
    const withFilter =
        new ManualTaskOrderController(
            createApp({
                taskFilters: {
                    areaId: "area-1"
                }
            }),
            {
                documentRef: createDocument()
            }
        );

    assert.equal(
        withSearch.canReorder(),
        false
    );
    assert.equal(
        withFilter.canReorder(),
        false
    );
});

test("deshabilita el arrastre en selección múltiple", () => {
    const controller =
        new ManualTaskOrderController(
            createApp({
                bulkSelectionMode: true
            }),
            {
                documentRef: createDocument()
            }
        );

    assert.equal(
        controller.canReorder(),
        false
    );
});

test("mantiene el gesto activo a nivel de documento", () => {
    const documentRef = createDocument();
    const controller =
        new ManualTaskOrderController(
            createApp(),
            { documentRef }
        );

    controller.bindActivePointer();

    assert.deepEqual(
        [...documentRef.listeners.keys()].sort(),
        ["pointercancel", "pointermove", "pointerup"]
    );
    assert.equal(
        documentRef.listeners.get("pointermove")
            .capture,
        true
    );

    controller.unbindActivePointer();

    assert.equal(documentRef.listeners.size, 0);
});

test("ignora eventos de otro dedo durante el arrastre", () => {
    const controller =
        new ManualTaskOrderController(
            createApp(),
            {
                documentRef: createDocument()
            }
        );

    controller.draggedId = "task-1";
    controller.activePointerId = 7;

    assert.equal(
        controller.isActivePointer({ pointerId: 7 }),
        true
    );
    assert.equal(
        controller.isActivePointer({ pointerId: 8 }),
        false
    );
});
