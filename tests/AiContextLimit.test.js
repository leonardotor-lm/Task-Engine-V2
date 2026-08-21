import test from "node:test";
import assert from "node:assert/strict";
import {
    buildAiTaskContext
} from "../src/core/AiTaskContext.js";

test("selecciona todas las tareas que vencen hoy sin un límite arbitrario", () => {
    const todayTasks = Array.from(
        { length: 90 },
        (_, index) => ({
            id: `today-${index}`,
            title: `Hoy ${index}`,
            status: "PENDING",
            dueDate: "2026-08-21",
            priority: 0,
            tagIds: []
        })
    );
    const otherTasks = Array.from(
        { length: 50 },
        (_, index) => ({
            id: `other-${index}`,
            title: `Otro ${index}`,
            status: "PENDING",
            dueDate: "2026-08-22",
            priority: 0,
            tagIds: []
        })
    );

    const context = buildAiTaskContext({
        tasks: [...todayTasks, ...otherTasks],
        question: "¿Qué tareas vencen hoy?",
        today: "2026-08-21"
    });

    assert.equal(context.taskCount, 90);
    assert.equal(context.tasks.length, 90);
    assert.equal(context.omittedCount, 0);
    assert.equal(
        context.tasks.every(
            task => task.dueDate === "2026-08-21"
        ),
        true
    );
});

test("una consulta de completadas esta semana excluye tareas ajenas", () => {
    const context = buildAiTaskContext({
        question: "¿Qué tareas completé esta semana?",
        today: "2026-08-21",
        tasks: [
            {
                id: "done-week",
                title: "Hecha esta semana",
                status: "COMPLETED",
                completedAt: "2026-08-19T10:00:00.000Z",
                tagIds: []
            },
            {
                id: "done-old",
                title: "Hecha antes",
                status: "COMPLETED",
                completedAt: "2026-08-10T10:00:00.000Z",
                tagIds: []
            },
            {
                id: "pending",
                title: "Pendiente",
                status: "PENDING",
                tagIds: []
            }
        ]
    });

    assert.deepEqual(
        context.tasks.map(task => task.title),
        ["Hecha esta semana"]
    );
});

test("reconoce área, espera y ausencia de fecha en la consulta", () => {
    const context = buildAiTaskContext({
        question:
            "¿Qué tareas sin fecha del área Casa están en espera?",
        today: "2026-08-21",
        areas: [{ id: "home", name: "Casa" }],
        tasks: [
            {
                id: "match",
                title: "Comprar repuesto",
                status: "PENDING",
                areaId: "home",
                isWaiting: true,
                tagIds: []
            },
            {
                id: "dated",
                title: "Pagar factura",
                status: "PENDING",
                areaId: "home",
                isWaiting: true,
                dueDate: "2026-08-25",
                tagIds: []
            },
            {
                id: "other-area",
                title: "Esperar respuesta",
                status: "PENDING",
                areaId: "work",
                isWaiting: true,
                tagIds: []
            }
        ]
    });

    assert.deepEqual(
        context.tasks.map(task => task.title),
        ["Comprar repuesto"]
    );
});

test("una consulta abierta no activa filtros por nombres sin categoría explícita", () => {
    const context = buildAiTaskContext({
        question:
            "Analizá mis tareas pendientes y decime cuáles requieren atención primero y por qué",
        today: "2026-08-21",
        areas: [{ id: "short-area", name: "IA" }],
        contexts: [{ id: "short-context", name: "Mis" }],
        tags: [{ id: "short-tag", name: "At" }],
        tasks: [
            {
                id: "pending-1",
                title: "Preparar clase",
                status: "PENDING",
                priority: 2,
                tagIds: []
            },
            {
                id: "pending-2",
                title: "IA",
                status: "PENDING",
                isProject: true,
                priority: 1,
                tagIds: []
            }
        ]
    });

    assert.equal(context.taskCount, 2);
    assert.deepEqual(
        context.tasks.map(task => task.title),
        ["Preparar clase", "IA"]
    );
});

test("una consulta de asesoramiento para hoy conserva todas las tareas activas", () => {
    const context = buildAiTaskContext({
        question: "¿Qué debería hacer hoy y qué parece más importante?",
        today: "2026-08-21",
        tasks: [
            {
                id: "today",
                title: "Vence hoy",
                status: "PENDING",
                dueDate: "2026-08-21",
                priority: 1,
                tagIds: []
            },
            {
                id: "later",
                title: "Puede desbloquear otra cosa",
                status: "PENDING",
                dueDate: "2026-08-25",
                priority: 3,
                tagIds: []
            }
        ]
    });

    assert.equal(context.taskCount, 2);
    assert.deepEqual(
        context.tasks.map(task => task.title),
        ["Vence hoy", "Puede desbloquear otra cosa"]
    );
});
