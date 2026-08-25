import test from "node:test";
import assert from "node:assert/strict";

import {
    buildAreaStatistics
} from "../src/core/Statistics.js";
import { StatisticsView } from "../src/ui/StatisticsView.js";

const task = (id, data = {}) => ({
    id,
    title: id,
    status: "PENDING",
    parentTaskId: null,
    areaId: null,
    isWaiting: false,
    postponements: [],
    completedAt: null,
    dueDate: null,
    ...data
});

test("calcula el avance por área con completadas del período y pendientes ejecutables", () => {
    const [personal] = buildAreaStatistics({
        areas: [{
            id: "personal",
            name: "Personal",
            color: "#c026d3"
        }],
        tasks: [
            task("recent-done", {
                areaId: "personal",
                status: "COMPLETED",
                completedAt: "2026-08-24T12:00:00.000Z"
            }),
            task("pending", {
                areaId: "personal"
            }),
            task("waiting", {
                areaId: "personal",
                isWaiting: true
            }),
            task("old-done", {
                areaId: "personal",
                status: "COMPLETED",
                completedAt: "2026-06-01T12:00:00.000Z"
            })
        ],
        period: "30",
        today: "2026-08-25"
    });

    assert.equal(personal.completed, 1);
    assert.equal(personal.pending, 1);
    assert.equal(personal.total, 2);
    assert.equal(personal.percentage, 50);
    assert.equal(personal.color, "#c026d3");
});

test("excluye archivadas papelera y jerarquías inválidas de las áreas", () => {
    const [work] = buildAreaStatistics({
        areas: [{ id: "work", name: "Trabajo" }],
        tasks: [
            task("archived", {
                areaId: "work",
                status: "ARCHIVED"
            }),
            task("deleted", {
                areaId: "work",
                status: "DELETED"
            }),
            task("orphan", {
                areaId: "work",
                parentTaskId: "missing"
            })
        ],
        period: "ALL",
        today: "2026-08-25"
    });

    assert.equal(work.total, 0);
    assert.equal(work.percentage, null);
});

test("todo el historial incorpora cualquier completada con fecha registrada", () => {
    const [area] = buildAreaStatistics({
        areas: [{ id: "area", name: "Área" }],
        tasks: [
            task("old", {
                areaId: "area",
                status: "COMPLETED",
                completedAt: "2025-01-01T12:00:00.000Z"
            })
        ],
        period: "ALL",
        today: "2026-08-25"
    });

    assert.equal(area.completed, 1);
    assert.equal(area.percentage, 100);
});

test("descarta colores de área inválidos", () => {
    const [area] = buildAreaStatistics({
        areas: [{
            id: "area",
            name: "Área",
            color: "red"
        }]
    });

    assert.equal(area.color, null);
});

test("Estadísticas mantiene Panorama general y organiza el desglose en tres pestañas", () => {
    const view = new StatisticsView();
    const html = view.render({
        today: "2026-08-25",
        areas: [{
            id: "personal",
            name: "Personal",
            color: "#c026d3"
        }],
        allTasks: [
            task("pending", {
                areaId: "personal"
            })
        ],
        statistics: {
            period: "30",
            panorama: {
                projects: 1,
                goals: 1,
                pending: 1,
                recentCompleted: 0
            },
            projects: [{
                id: "project",
                title: "Proyecto",
                completed: 0,
                total: 1,
                percentage: 0,
                pending: 1,
                overdue: 0,
                postponed: 0,
                recentCompleted: 0,
                lastAdvance: null
            }],
            goals: [{
                id: "goal",
                title: "Objetivo",
                daysAvailable: null,
                subgoalCount: 0,
                own: {
                    completed: 0,
                    total: 1,
                    percentage: 0
                },
                accumulated: {
                    completed: 0,
                    total: 1,
                    percentage: 0,
                    pending: 1,
                    overdue: 0,
                    postponed: 0,
                    recentCompleted: 0,
                    lastAdvance: null
                }
            }]
        }
    });

    assert.match(html, /Panorama general/);
    assert.match(html, /id="statisticsTabAreas"\s+checked/);
    assert.match(html, /for="statisticsTabAreas">\s*Áreas/);
    assert.match(html, /for="statisticsTabProjects">\s*Proyectos/);
    assert.match(html, /for="statisticsTabGoals">\s*Objetivos/);
    assert.match(html, /Personal/);
    assert.match(html, /Proyecto/);
    assert.match(html, /Objetivo/);
    assert.match(html, /Pendientes/);
    assert.match(html, /Vencidas/);
    assert.match(html, /Pospuestas/);
    assert.match(html, /Último avance/);
});
