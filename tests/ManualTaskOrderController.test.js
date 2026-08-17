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

function row(id, top, bottom) {
    return {
        dataset: { id },
        getBoundingClientRect() {
            return {
                top,
                bottom,
                height: bottom - top
            };
        }
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

test("usa sólo el mismo nivel jerárquico cuando los padres están visibles", () => {
    const tasks = new Map([
        ["parent", activeTask(null)],
        ["drag", activeTask("parent")],
        ["a", activeTask("parent")],
        ["b", activeTask("parent")],
        ["other-parent", activeTask(null)],
        ["other", activeTask("other-parent")]
    ]);
    const rows = [
        row("parent", 40, 80),
        row("a", 100, 150),
        row("other", 151, 179),
        row("b", 180, 230),
        row("other-parent", 240, 280)
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

test("trata como nivel raíz una hija cuyo padre no está visible", () => {
    const tasks = new Map([
        ["drag", activeTask("hidden-parent")],
        ["sibling", activeTask("hidden-parent")],
        ["loose", activeTask(null)],
        ["project", activeTask(null)]
    ]);
    const rows = [
        row("sibling", 100, 150),
        row("loose", 151, 200),
        row("project", 201, 250)
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
        controller.isValidTargetRow(rows[1]),
        true
    );
    assert.equal(
        controller.isValidTargetRow(rows[2]),
        true
    );
});

test("no permite salir del grupo cuando el padre sí está visible", () => {
    const tasks = new Map([
        ["parent", activeTask(null)],
        ["drag", activeTask("parent")],
        ["sibling", activeTask("parent")],
        ["loose", activeTask(null)]
    ]);
    const rows = [
        row("parent", 50, 90),
        row("sibling", 100, 150),
        row("loose", 151, 200)
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
        controller.isValidTargetRow(rows[1]),
        true
    );
    assert.equal(
        controller.isValidTargetRow(rows[2]),
        false
    );
});

function createTopHarness({
    firstTop = 320,
    scrollTop = 0
} = {}) {
    const tasks = new Map([
        ["drag", activeTask(null)],
        ["first", activeTask(null)],
        ["second", activeTask(null)],
        ["third", activeTask(null)],
        ["fourth", activeTask(null)],
        ["fifth", activeTask(null)]
    ]);
    const rows = [
        row("first", firstTop, firstTop + 50),
        row("second", firstTop + 51, firstTop + 101),
        row("third", firstTop + 102, firstTop + 152),
        row("fourth", firstTop + 153, firstTop + 203),
        row("fifth", firstTop + 204, firstTop + 254)
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
        scrollTop,
        getBoundingClientRect() {
            return {
                top: 40,
                bottom: 700
            };
        }
    };
    controller.getRows = () => rows;

    return { controller, rows };
}

test("ancla posición uno y dos a las primeras filas aunque haya encabezado alto", () => {
    const { controller, rows } =
        createTopHarness({ firstTop: 320 });

    assert.deepEqual(
        controller.resolveTopBoundaryTarget(340),
        {
            row: rows[0],
            placement: "before"
        }
    );
    assert.deepEqual(
        controller.resolveTopBoundaryTarget(390),
        {
            row: rows[0],
            placement: "after"
        }
    );
    assert.equal(
        controller.resolveTopBoundaryTarget(430),
        null
    );
});

test("una vista de varias tareas sin scroll puede llegar a posiciones uno y dos", () => {
    const { controller, rows } =
        createTopHarness({
            firstTop: 280,
            scrollTop: 0
        });

    assert.equal(
        controller.isFirstTargetVisible(),
        true
    );
    assert.deepEqual(
        controller.resolveTopBoundaryTarget(300),
        {
            row: rows[0],
            placement: "before"
        }
    );
    assert.deepEqual(
        controller.resolveTopBoundaryTarget(350),
        {
            row: rows[0],
            placement: "after"
        }
    );
});

test("mantiene auto-scroll mientras la primera tarea está fuera de pantalla", () => {
    const { controller } =
        createTopHarness({
            firstTop: -180,
            scrollTop: 80
        });

    assert.equal(
        controller.isFirstTargetVisible(),
        false
    );
    assert.equal(
        controller.resolveTopBoundaryTarget(120),
        null
    );
    assert.ok(
        controller.getAutoScrollStep(80) < 0
    );
});

test("lista corta sigue permitiendo mover la segunda tarea al primer lugar", () => {
    const tasks = new Map([
        ["drag", activeTask(null)],
        ["first", activeTask(null)]
    ]);
    const first = row("first", 280, 330);
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
    controller.getRows = () => [first];

    assert.deepEqual(
        controller.resolveTopBoundaryTarget(300),
        {
            row: first,
            placement: "before"
        }
    );
});
