import test from "node:test";
import assert from "node:assert/strict";
import {
    buildTaskReviewSignals
} from "../src/core/TaskReviewSignals.js";
import {
    buildWhatDoNowRecommendations
} from "../src/core/WhatDoNow.js";

const TODAY = "2026-09-11";
let taskSequence = 0;

function task(overrides = {}) {
    taskSequence += 1;
    return {
        id: overrides.id || `generated-task-${taskSequence}`,
        title: overrides.title || "Tarea",
        status: "PENDING",
        priority: 0,
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-01T12:00:00.000Z",
        startDate: null,
        dueDate: null,
        dueTime: null,
        areaId: null,
        contextId: null,
        tagIds: [],
        goalIds: [],
        parentTaskId: null,
        isProject: false,
        isWaiting: false,
        recurrence: null,
        postponements: [],
        ...overrides
    };
}

test("genera señales transparentes para vencidas, estancadas y pospuestas", () => {
    const signals = buildTaskReviewSignals({
        today: TODAY,
        tasks: [
            task({
                id: "overdue",
                dueDate: "2026-09-08"
            }),
            task({
                id: "stale",
                updatedAt: "2026-07-01T10:00:00.000Z"
            }),
            task({
                id: "postponed",
                postponements: [{}, {}, {}]
            })
        ]
    });

    assert.ok(signals.some(signal =>
        signal.taskId === "overdue" &&
        signal.type === "OVERDUE"
    ));
    assert.ok(signals.some(signal =>
        signal.taskId === "stale" &&
        signal.type === "STALE_UNSCHEDULED"
    ));
    assert.ok(signals.some(signal =>
        signal.taskId === "postponed" &&
        signal.type === "REPEATED_POSTPONEMENTS"
    ));
});

test("permite desactivar reglas o cambiar sus umbrales", () => {
    const signals = buildTaskReviewSignals({
        today: TODAY,
        tasks: [
            task({
                id: "candidate",
                updatedAt: "2026-08-01T10:00:00.000Z",
                postponements: [{}, {}]
            })
        ],
        config: {
            staleUnscheduled: { enabled: false },
            repeatedPostponements: { count: 2 }
        }
    });

    assert.equal(
        signals.some(signal => signal.type === "STALE_UNSCHEDULED"),
        false
    );
    assert.equal(
        signals.some(signal => signal.type === "REPEATED_POSTPONEMENTS"),
        true
    );
});

test("prioriza vencimientos y prioridad sin recomendar tareas bloqueadas", () => {
    const recommendations = buildWhatDoNowRecommendations({
        today: TODAY,
        tasks: [
            task({
                id: "urgent",
                title: "Resolver vencida",
                dueDate: "2026-09-10",
                priority: 3
            }),
            task({
                id: "normal",
                title: "Tarea sin fecha",
                priority: 1
            }),
            task({
                id: "waiting",
                title: "Esperando respuesta",
                dueDate: "2026-09-09",
                priority: 4,
                isWaiting: true
            })
        ]
    });

    assert.equal(recommendations[0].taskId, "urgent");
    assert.equal(
        recommendations.some(item => item.taskId === "waiting"),
        false
    );
    assert.match(recommendations[0].reasons.join(" "), /vencida|Venció/);
});

test("no propone proyectos contenedores ni tareas que todavía no empezaron", () => {
    const recommendations = buildWhatDoNowRecommendations({
        today: TODAY,
        tasks: [
            task({
                id: "project",
                title: "Proyecto",
                isProject: true,
                priority: 4
            }),
            task({
                id: "future",
                title: "Todavía no",
                startDate: "2026-09-15",
                priority: 4
            }),
            task({
                id: "available",
                title: "Disponible"
            })
        ]
    });

    assert.deepEqual(
        recommendations.map(item => item.taskId),
        ["available"]
    );
});

test("devuelve como máximo cinco recomendaciones y conserva los datos separados", () => {
    const recommendations = buildWhatDoNowRecommendations({
        today: TODAY,
        tasks: Array.from({ length: 8 }, (_, index) =>
            task({
                id: `task-${index}`,
                title: `Tarea ${index}`,
                contextId: "home"
            })
        ),
        contexts: [{ id: "home", name: "Casa" }],
        limit: 5
    });

    assert.equal(recommendations.length, 5);
    assert.equal(recommendations[0].data.context, "Casa");
    assert.ok(Array.isArray(recommendations[0].reasons));
});
