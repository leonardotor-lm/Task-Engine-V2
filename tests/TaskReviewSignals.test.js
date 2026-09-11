import test from "node:test";
import assert from "node:assert/strict";
import {
    buildTaskReviewSignals
} from "../src/core/TaskReviewSignals.js";

const TODAY = "2026-09-11";

function task(overrides = {}) {
    return {
        id: "task",
        title: "Tarea",
        status: "PENDING",
        createdAt: "2026-09-10T12:00:00.000Z",
        updatedAt: "2026-09-10T12:00:00.000Z",
        startDate: null,
        dueDate: null,
        parentTaskId: null,
        isProject: false,
        isWaiting: false,
        postponements: [],
        ...overrides
    };
}

test("detecta una tarea procesada sin fecha ni proyecto", () => {
    const signals = buildTaskReviewSignals({
        tasks: [task()],
        today: TODAY,
        config: {
            staleUnscheduled: { enabled: false },
            repeatedPostponements: { enabled: false }
        }
    });

    assert.ok(signals.some(signal =>
        signal.type === "UNPLANNED_PROCESSED" &&
        signal.taskId === "task"
    ));
});

test("no marca como sin planificación una tarea En espera, proyecto o subtarea", () => {
    const signals = buildTaskReviewSignals({
        tasks: [
            task({ id: "waiting", isWaiting: true }),
            task({ id: "project", isProject: true }),
            task({ id: "child", parentTaskId: "project" })
        ],
        today: TODAY,
        config: {
            staleUnscheduled: { enabled: false },
            repeatedPostponements: { enabled: false }
        }
    });

    assert.equal(
        signals.some(signal => signal.type === "UNPLANNED_PROCESSED"),
        false
    );
});

test("permite desactivar la regla de procesadas sin planificación", () => {
    const signals = buildTaskReviewSignals({
        tasks: [task()],
        today: TODAY,
        config: {
            unplannedProcessed: { enabled: false },
            staleUnscheduled: { enabled: false },
            repeatedPostponements: { enabled: false }
        }
    });

    assert.equal(signals.length, 0);
});
