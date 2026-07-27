import test from "node:test";
import assert from "node:assert/strict";

import {
    AdvancedSearchSyntaxError,
    compileAdvancedSearch,
    matchesAdvancedSearch
} from "../src/core/AdvancedSearch.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

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
        parentTaskId: overrides.parentTaskId ?? null,
        recurrence: overrides.recurrence ?? null
    };

}

const context = {
    today: "2026-07-27",
    areas: [
        { id: "area-work", name: "Trabajo docente" },
        { id: "area-home", name: "Personal" }
    ],
    contexts: [
        { id: "context-school", name: "Escuela" }
    ],
    tags: [
        { id: "tag-important", name: "Importante" },
        { id: "tag-reading", name: "Lectura" }
    ],
    tasks: []
};

test("una consulta vacía no crea una expresión", () => {

    assert.equal(
        compileAdvancedSearch("   "),
        null
    );

});

test("busca texto ignorando mayúsculas y tildes", () => {

    const expression =
        compileAdvancedSearch(
            "\"evaluacion trimestral\""
        );

    assert.equal(
        matchesAdvancedSearch(
            task({
                description:
                    "Preparar la Evaluación Trimestral"
            }),
            expression,
            context
        ),
        true
    );

});

test("combina campos con AND explícito", () => {

    const expression =
        compileAdvancedSearch(
            "prioridad:alta AND area:\"Trabajo docente\""
        );

    assert.equal(
        matchesAdvancedSearch(
            task({
                priority: 3,
                areaId: "area-work"
            }),
            expression,
            context
        ),
        true
    );

    assert.equal(
        matchesAdvancedSearch(
            task({
                priority: 2,
                areaId: "area-work"
            }),
            expression,
            context
        ),
        false
    );

});

test("admite AND implícito entre términos", () => {

    const expression =
        compileAdvancedSearch(
            "contexto:Escuela etiqueta:Importante"
        );

    assert.equal(
        matchesAdvancedSearch(
            task({
                contextId: "context-school",
                tagIds: ["tag-important"]
            }),
            expression,
            context
        ),
        true
    );

});

test("combina OR, NOT y paréntesis", () => {

    const expression =
        compileAdvancedSearch(
            "(prioridad:critica OR prioridad:alta) NOT etiqueta:Lectura"
        );

    assert.equal(
        matchesAdvancedSearch(
            task({
                priority: 4,
                tagIds: ["tag-important"]
            }),
            expression,
            context
        ),
        true
    );

    assert.equal(
        matchesAdvancedSearch(
            task({
                priority: 4,
                tagIds: ["tag-reading"]
            }),
            expression,
            context
        ),
        false
    );

});

test("filtra estados y propiedades booleanas", () => {

    const parent = task({
        id: "parent",
        status: TaskStatus.COMPLETED,
        recurrence: "WEEKLY"
    });

    const child = task({
        id: "child",
        parentTaskId: parent.id
    });

    const searchContext = {
        ...context,
        tasks: [parent, child]
    };

    const expression =
        compileAdvancedSearch(
            "estado:completada AND tieneSubtareas:si AND recurrente:true"
        );

    assert.equal(
        matchesAdvancedSearch(
            parent,
            expression,
            searchContext
        ),
        true
    );

});

test("filtra fechas relativas y fechas exactas", () => {

    assert.equal(
        matchesAdvancedSearch(
            task({ dueDate: "2026-07-27" }),
            compileAdvancedSearch("fecha:hoy"),
            context
        ),
        true
    );

    assert.equal(
        matchesAdvancedSearch(
            task({ dueDate: "2026-07-26" }),
            compileAdvancedSearch("fecha:atrasada"),
            context
        ),
        true
    );

    assert.equal(
        matchesAdvancedSearch(
            task({ dueDate: "2026-08-01" }),
            compileAdvancedSearch(
                "fecha:>2026-07-30"
            ),
            context
        ),
        true
    );

});

test("acepta nombres de campos en inglés", () => {

    const expression =
        compileAdvancedSearch(
            "status:pending AND tag:Importante"
        );

    assert.equal(
        matchesAdvancedSearch(
            task({
                status: TaskStatus.PENDING,
                tagIds: ["tag-important"]
            }),
            expression,
            context
        ),
        true
    );

});

test("informa un campo desconocido", () => {

    assert.throws(
        () => compileAdvancedSearch(
            "proyecto:Escuela"
        ),
        error =>
            error instanceof
                AdvancedSearchSyntaxError &&
            /no existe/.test(error.message)
    );

});

test("informa comillas y paréntesis incompletos", () => {

    assert.throws(
        () => compileAdvancedSearch(
            "area:\"Trabajo"
        ),
        AdvancedSearchSyntaxError
    );

    assert.throws(
        () => compileAdvancedSearch(
            "(prioridad:alta OR prioridad:media"
        ),
        AdvancedSearchSyntaxError
    );

});
