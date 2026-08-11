import test from "node:test";
import assert from "node:assert/strict";
import {
    buildProgressStatistics
} from "../src/core/Statistics.js";
import { StatisticsView } from "../src/ui/StatisticsView.js";

const task = (id, data = {}) => ({
    id,
    title: id,
    status: "PENDING",
    parentTaskId: null,
    goalIds: [],
    postponements: [],
    completedAt: null,
    dueDate: null,
    ...data
});

const goal = (id, data = {}) => ({
    id,
    title: id,
    status: "ACTIVE",
    parentGoalId: null,
    dueDate: null,
    ...data
});

test("calcula el avance de un proyecto desde sus descendientes", () => {
    const result = buildProgressStatistics({
        tasks: [
            task("project"),
            task("one", {
                parentTaskId: "project",
                status: "COMPLETED"
            }),
            task("two", {
                parentTaskId: "project"
            })
        ],
        today: "2026-08-11"
    });

    assert.equal(result.projects[0].percentage, 50);
    assert.equal(result.projects[0].completed, 1);
});

test("excluye archivadas y papelera del desglose", () => {
    const result = buildProgressStatistics({
        tasks: [
            task("project"),
            task("archived", {
                parentTaskId: "project",
                status: "ARCHIVED"
            }),
            task("deleted", {
                parentTaskId: "project",
                status: "DELETED"
            })
        ],
        today: "2026-08-11"
    });

    assert.equal(result.projects.length, 0);
});

test("marca proyectos sin descendientes activos como inexistentes", () => {
    const result = buildProgressStatistics({
        tasks: [task("standalone")],
        today: "2026-08-11"
    });

    assert.deepEqual(result.projects, []);
});

test("deduplica tareas asociadas directa e indirectamente", () => {
    const result = buildProgressStatistics({
        tasks: [
            task("project", {
                goalIds: ["goal"]
            }),
            task("child", {
                parentTaskId: "project",
                goalIds: ["goal"]
            })
        ],
        goals: [goal("goal")],
        today: "2026-08-11"
    });

    assert.equal(result.goals[0].own.total, 1);
});

test("separa avance propio y acumulado de objetivos", () => {
    const result = buildProgressStatistics({
        tasks: [
            task("own", {
                goalIds: ["parent"],
                status: "COMPLETED"
            }),
            task("child-task", {
                goalIds: ["child"]
            })
        ],
        goals: [
            goal("parent"),
            goal("child", {
                parentGoalId: "parent"
            })
        ],
        today: "2026-08-11"
    });

    const parent = result.goals.find(
        item => item.id === "parent"
    );

    assert.equal(parent.own.total, 1);
    assert.equal(parent.accumulated.total, 2);
});

test("no completa automáticamente un objetivo al llegar a cien", () => {
    const result = buildProgressStatistics({
        tasks: [
            task("done", {
                goalIds: ["goal"],
                status: "COMPLETED"
            })
        ],
        goals: [goal("goal")],
        today: "2026-08-11"
    });

    assert.equal(result.goals[0].accumulated.percentage, 100);
    assert.equal(result.goals[0].status, "ACTIVE");
});

test("calcula vencidas, pospuestas y último avance", () => {
    const result = buildProgressStatistics({
        tasks: [
            task("project"),
            task("late", {
                parentTaskId: "project",
                dueDate: "2026-08-10",
                postponements: ["2026-08-01"]
            }),
            task("done", {
                parentTaskId: "project",
                status: "COMPLETED",
                completedAt: "2026-08-09T12:00:00.000Z"
            })
        ],
        today: "2026-08-11"
    });

    assert.equal(result.projects[0].overdue, 1);
    assert.equal(result.projects[0].postponed, 1);
    assert.match(
        result.projects[0].lastAdvance,
        /^2026-08-09/
    );
});

test("aplica el período sólo al ritmo reciente", () => {
    const result = buildProgressStatistics({
        period: "7",
        tasks: [
            task("project"),
            task("old", {
                parentTaskId: "project",
                status: "COMPLETED",
                completedAt: "2026-07-01T12:00:00.000Z"
            }),
            task("recent", {
                parentTaskId: "project",
                status: "COMPLETED",
                completedAt: "2026-08-10T12:00:00.000Z"
            })
        ],
        today: "2026-08-11"
    });

    assert.equal(result.projects[0].percentage, 100);
    assert.equal(result.projects[0].recentCompleted, 1);
});

test("admite períodos de seis y doce meses", () => {
    for (const period of ["180", "365"]) {
        const result = buildProgressStatistics({
            period,
            today: "2026-08-11"
        });

        assert.equal(result.period, period);
    }

    const view = new StatisticsView();
    const html = view.render({
        statistics: buildProgressStatistics({
            period: "180",
            today: "2026-08-11"
        })
    });

    assert.match(html, /<option value="180" selected>6 meses<\/option>/);
    assert.match(html, /<option value="365" >12 meses<\/option>/);
    assert.match(html, /Completadas en 6 meses/);
});

test("calcula los días disponibles de un objetivo", () => {
    const result = buildProgressStatistics({
        goals: [
            goal("goal", {
                dueDate: "2026-08-20"
            })
        ],
        today: "2026-08-11"
    });

    assert.equal(result.goals[0].daysAvailable, 9);
});
