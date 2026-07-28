import test from "node:test";
import assert from "node:assert/strict";

import {
    compileAdvancedSearch,
    matchesAdvancedSearch
} from "../src/core/AdvancedSearch.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

const context = {
    today: "2026-07-27",
    areas: [
        { id: "work", name: "Trabajo docente" }
    ],
    contexts: [
        { id: "school", name: "Escuela secundaria" }
    ],
    tags: [
        { id: "important", name: "Muy importante" }
    ],
    tasks: []
};

function task(overrides = {}) {

    return {
        id: overrides.id ?? crypto.randomUUID(),
        title: overrides.title ?? "Preparar clase",
        description: overrides.description ?? "",
        status: overrides.status ?? TaskStatus.PENDING,
        areaId: overrides.areaId ?? null,
        contextId: overrides.contextId ?? null,
        tagIds: overrides.tagIds ?? [],
        priority: overrides.priority ?? 0,
        dueDate: overrides.dueDate ?? null,
        completedAt: overrides.completedAt ?? null,
        createdAt:
            overrides.createdAt ??
            "2026-07-20T12:00:00.000Z",
        updatedAt:
            overrides.updatedAt ??
            "2026-07-26T12:00:00.000Z",
        parentTaskId: overrides.parentTaskId ?? null,
        recurrence: overrides.recurrence ?? null,
        postponements: overrides.postponements ?? [],
        attachments: overrides.attachments ?? []
    };

}

function matches(item, query) {

    return matchesAdvancedSearch(
        item,
        compileAdvancedSearch(query),
        context
    );

}

test("busca específicamente en título y descripción", () => {

    const item = task({
        title: "Preparar evaluación",
        description: "Revisar la bibliografía anual"
    });

    assert.equal(
        matches(item, "titulo:evaluacion"),
        true
    );

    assert.equal(
        matches(item, "descripcion:bibliografia"),
        true
    );

    assert.equal(
        matches(item, "titulo:bibliografia"),
        false
    );

});

test("busca coincidencias parciales en entidades", () => {

    const item = task({
        areaId: "work",
        contextId: "school",
        tagIds: ["important"]
    });

    assert.equal(
        matches(
            item,
            "areaContiene:docente AND contextoContiene:secundaria AND etiquetaContiene:import"
        ),
        true
    );

});

test("detecta presencia de etiquetas y fecha", () => {

    const item = task({
        tagIds: ["important"],
        dueDate: "2026-07-30"
    });

    assert.equal(
        matches(
            item,
            "tieneEtiquetas:si AND tieneFecha:si"
        ),
        true
    );

    assert.equal(
        matches(item, "tieneFecha:no"),
        false
    );

});

test("compara fechas y períodos futuros", () => {

    const item = task({
        dueDate: "2026-08-01"
    });

    assert.equal(
        matches(
            item,
            "fechaDespues:hoy AND fechaAntes:2026-08-10"
        ),
        true
    );

    assert.equal(
        matches(
            item,
            "fechaDentro:\"7 dias\""
        ),
        true
    );

    assert.equal(
        matches(
            item,
            "fecha:>=2026-08-01"
        ),
        true
    );

});

test("busca por fechas de creación, actualización y finalización", () => {

    const item = task({
        status: TaskStatus.COMPLETED,
        completedAt:
            "2026-07-27T15:00:00.000Z",
        createdAt:
            "2026-07-20T12:00:00.000Z",
        updatedAt:
            "2026-07-27T15:00:00.000Z"
    });

    assert.equal(
        matches(
            item,
            "completada:hoy AND creadaDespues:2026-07-01 AND actualizadaDentro:\"7 dias\""
        ),
        true
    );

    assert.equal(
        matches(
            item,
            "completadaDentro:\"7 dias\""
        ),
        true
    );

});

test("compara la cantidad de posposiciones", () => {

    const item = task({
        postponements: [{}, {}, {}, {}]
    });

    assert.equal(
        matches(
            item,
            "posposiciones:>3"
        ),
        true
    );

    assert.equal(
        matches(
            item,
            "posposiciones:<=4"
        ),
        true
    );

    assert.equal(
        matches(
            item,
            "posposiciones:<4"
        ),
        false
    );

});

test("detecta subtareas, adjuntos y tipo de recurrencia", () => {

    const item = task({
        parentTaskId: "parent",
        attachments: [
            { name: "programa.pdf" }
        ],
        recurrence: "WEEKLY"
    });

    assert.equal(
        matches(
            item,
            "esSubtarea:si AND tieneAdjuntos:si AND repeticion:semanal"
        ),
        true
    );

});

test("estado incompleto incluye Inbox y Pendiente", () => {

    assert.equal(
        matches(
            task({ status: TaskStatus.INBOX }),
            "estado:incompleta"
        ),
        true
    );

    assert.equal(
        matches(
            task({ status: TaskStatus.PENDING }),
            "estado:incompleta"
        ),
        true
    );

    assert.equal(
        matches(
            task({ status: TaskStatus.COMPLETED }),
            "estado:incompleta"
        ),
        false
    );

});


test("busca vencimientos de ayer y mañana", () => {

    assert.equal(
        matches(
            task({ dueDate: "2026-07-26" }),
            "fecha:ayer"
        ),
        true
    );

    assert.equal(
        matches(
            task({ dueDate: "2026-07-28" }),
            "fecha:manana"
        ),
        true
    );

});
