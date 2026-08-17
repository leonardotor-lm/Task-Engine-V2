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

function activeTask(parentTaskId = null) {
    return {
        parentTaskId,
        isCompleted: () => false,
        isArchived: () => false,
        isDeleted: () => false
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

test("auto-scroll acelera cerca de los bordes y se detiene en el centro", () => {
    const controller =
        new ManualTaskOrderController(
            createApp(),
            {
                documentRef: createDocument(),
                windowRef: { innerHeight: 800 }
            }
        );

    controller.scrollContainer = {
        scrollTop: 50,
        getBoundingClientRect() {
            return {
                top: 100,
                bottom: 700
            };
        }
    };

    assert.ok(
        controller.getAutoScrollStep(110) < 0
    );
    assert.equal(
        controller.getAutoScrollStep(400),
        0
    );
    assert.ok(
        controller.getAutoScrollStep(690) > 0
    );
});

test("usa la tarea hermana válida más cercana entre filas", () => {
    const tasks = new Map([
        ["drag", activeTask("parent")],
        ["a", activeTask("parent")],
        ["b", activeTask("parent")],
        ["other", activeTask("otro")]
    ]);
    const rows = [
        {
            dataset: { id: "a" },
            getBoundingClientRect() {
                return {
                    top: 100,
                    bottom: 150
                };
            }
        },
        {
            dataset: { id: "b" },
            getBoundingClientRect() {
                return {
                    top: 180,
                    bottom: 230
                };
            }
        },
        {
            dataset: { id: "other" },
            getBoundingClientRect() {
                return {
                    top: 151,
                    bottom: 179
                };
            }
        }
    ];
    const controller =
        new ManualTaskOrderController(
            createApp({
                taskService: {
                    getTaskById(id) {
                        return tasks.get(id) ?? null;
                    }
                }
            }),
            {
                documentRef: createDocument()
            }
        );

    controller.draggedId = "drag";
    controller.getRows = () => rows;

    assert.equal(
        controller.findNearestValidRow(168)
            ?.dataset?.id,
        "b"
    );
});

test("ofrece zonas amplias para posiciones uno y dos al llegar al borde superior", () => {
    const tasks = new Map([
        ["drag", activeTask(null)],
        ["first", activeTask(null)],
        ["second", activeTask(null)]
    ]);
    const rows = [
        { dataset: { id: "first" } },
        { dataset: { id: "second" } }
    ];
    const controller =
        new ManualTaskOrderController(
            createApp({
                taskService: {
                    getTaskById(id) {
                        return tasks.get(id) ?? null;
                    }
                }
            }),
            {
                documentRef: createDocument()
            }
        );

    controller.draggedId = "drag";
    controller.scrollContainer = {
        scrollTop: 0,
        getBoundingClientRect() {
            return {
                top: 40,
                bottom: 700
            };
        }
    };
    controller.getRows = () => rows;

    assert.deepEqual(
        controller.resolveTopBoundaryTarget(120),
        {
            row: rows[0],
            placement: "before"
        }
    );
    assert.deepEqual(
        controller.resolveTopBoundaryTarget(220),
        {
            row: rows[0],
            placement: "after"
        }
    );
});

test("no fuerza posiciones superiores mientras todavía queda scroll hacia arriba", () => {
    const tasks = new Map([
        ["drag", activeTask(null)],
        ["first", activeTask(null)]
    ]);
    const row = {
        dataset: { id: "first" }
    };
    const controller =
        new ManualTaskOrderController(
            createApp({
                taskService: {
                    getTaskById(id) {
                        return tasks.get(id) ?? null;
                    }
                }
            }),
            {
                documentRef: createDocument()
            }
        );

    controller.draggedId = "drag";
    controller.scrollContainer = {
        scrollTop: 80,
        getBoundingClientRect() {
            return {
                top: 40,
                bottom: 700
            };
        }
    };
    controller.getRows = () => [row];

    assert.equal(
        controller.resolveTopBoundaryTarget(120),
        null
    );
    assert.ok(
        controller.getAutoScrollStep(50) < 0
    );
});

test("al llegar al inicio deja de insistir con auto-scroll hacia arriba", () => {
    const controller =
        new ManualTaskOrderController(
            createApp(),
            {
                documentRef: createDocument()
            }
        );

    controller.scrollContainer = {
        scrollTop: 0,
        getBoundingClientRect() {
            return {
                top: 40,
                bottom: 700
            };
        }
    };

    assert.equal(
        controller.getAutoScrollStep(50),
        0
    );
});
