import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
    buildViewTaskSummary
} from "../src/ui/ViewTaskSummaryController.js";
import { View } from "../src/core/View.js";

function task({
    id,
    status = "PENDING",
    dueDate = null,
    completedAt = null,
    areaId = null,
    parentTaskId = null,
    isProject = false,
    title = id,
    description = "",
    contextId = null,
    tagIds = [],
    priority = 0
}) {
    return {
        id,
        status,
        dueDate,
        completedAt,
        areaId,
        parentTaskId,
        isProject,
        title,
        description,
        contextId,
        tagIds,
        priority,
        isCompleted() {
            return this.status === "COMPLETED";
        },
        isArchived() {
            return this.status === "ARCHIVED";
        },
        isDeleted() {
            return this.status === "DELETED";
        }
    };
}

function baseState(overrides = {}) {
    return {
        view: View.ALL,
        today: "2026-08-20",
        tasks: [],
        allTasks: [],
        searchQuery: "",
        advancedSearchMode: false,
        taskFilters: {},
        activeAreaId: null,
        projectTask: null,
        ...overrides
    };
}

test("Todas resume activas, hoy, vencidas y completadas aunque estén ocultas", () => {
    const activeToday = task({
        id: "today",
        dueDate: "2026-08-20"
    });
    const overdue = task({
        id: "overdue",
        dueDate: "2026-08-19"
    });
    const undated = task({ id: "undated" });
    const completedOld = task({
        id: "completed-old",
        status: "COMPLETED",
        completedAt: "2026-08-10T12:00:00.000Z"
    });
    const completedToday = task({
        id: "completed-today",
        status: "COMPLETED",
        completedAt: "2026-08-20T15:00:00.000Z"
    });

    const summary = buildViewTaskSummary(
        baseState({
            tasks: [activeToday, overdue, undated],
            allTasks: [
                activeToday,
                overdue,
                undated,
                completedOld,
                completedToday
            ]
        })
    );

    assert.deepEqual(
        summary.items.map(item => item.value),
        [3, 1, 1, 2]
    );
});

test("Hoy cuenta como completadas sólo las tareas finalizadas hoy", () => {
    const active = task({
        id: "active",
        dueDate: "2026-08-20"
    });
    const completedToday = task({
        id: "completed-today",
        status: "COMPLETED",
        completedAt: "2026-08-20T08:00:00.000Z"
    });
    const completedYesterday = task({
        id: "completed-yesterday",
        status: "COMPLETED",
        completedAt: "2026-08-19T18:00:00.000Z"
    });

    const summary = buildViewTaskSummary(
        baseState({
            view: View.TODAY,
            tasks: [active],
            allTasks: [
                active,
                completedToday,
                completedYesterday
            ]
        })
    );

    assert.equal(summary.items[3].value, 1);
});

test("Mañana y Próximas muestran sólo el total pendiente", () => {
    const tasks = [
        task({ id: "one" }),
        task({ id: "two" })
    ];

    for (const view of [View.TOMORROW, View.UPCOMING]) {
        const summary = buildViewTaskSummary(
            baseState({ view, tasks, allTasks: tasks })
        );

        assert.deepEqual(summary.items, [{
            kind: "total",
            value: 2,
            label: "tareas"
        }]);
    }
});

test("el contador de área limita también las completadas al área y filtros activos", () => {
    const active = task({
        id: "active",
        areaId: "personal",
        priority: 4
    });
    const completedMatching = task({
        id: "completed-matching",
        status: "COMPLETED",
        areaId: "personal",
        priority: 4,
        completedAt: "2026-08-18T12:00:00.000Z"
    });
    const completedOtherPriority = task({
        id: "completed-low",
        status: "COMPLETED",
        areaId: "personal",
        priority: 1,
        completedAt: "2026-08-18T12:00:00.000Z"
    });
    const completedOtherArea = task({
        id: "completed-work",
        status: "COMPLETED",
        areaId: "work",
        priority: 4,
        completedAt: "2026-08-18T12:00:00.000Z"
    });

    const summary = buildViewTaskSummary(
        baseState({
            view: View.AREA,
            activeAreaId: "personal",
            taskFilters: { priority: "4" },
            tasks: [active],
            allTasks: [
                active,
                completedMatching,
                completedOtherPriority,
                completedOtherArea
            ]
        })
    );

    assert.equal(summary.items[3].value, 1);
});

test("búsqueda avanzada sustituye el resumen por cantidad de resultados", () => {
    const tasks = [
        task({ id: "one" }),
        task({ id: "two" }),
        task({ id: "three" })
    ];

    const summary = buildViewTaskSummary(
        baseState({
            tasks,
            allTasks: tasks,
            advancedSearchMode: true,
            searchQuery: "estado:pendiente"
        })
    );

    assert.equal(summary.advancedResultCount, 3);
    assert.deepEqual(summary.items, []);
});

test("la integración carga controlador y estilos también en PWA", () => {
    const main = fs.readFileSync(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const index = fs.readFileSync(
        new URL("../index.html", import.meta.url),
        "utf8"
    );
    const pwaAssets = fs.readFileSync(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );
    const css = fs.readFileSync(
        new URL(
            "../styles/view-task-summary.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        main,
        /ViewTaskSummaryController/
    );
    assert.ok(
        main.indexOf(
            "viewTaskSummaryController.start()"
        ) < main.indexOf(
            "strictAdvancedSearchResultsController.start()"
        )
    );
    assert.match(
        index,
        /styles\/view-task-summary\.css/
    );
    assert.match(
        pwaAssets,
        /src\/ui\/ViewTaskSummaryController\.js/
    );
    assert.match(
        pwaAssets,
        /styles\/view-task-summary\.css/
    );
    assert.doesNotMatch(css, /#[0-9a-f]{3,8}/i);
    assert.match(css, /var\(--color-danger\)/);
    assert.match(css, /var\(--color-success\)/);
});
