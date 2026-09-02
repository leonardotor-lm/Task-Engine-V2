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
    goals: [
        {
            id: "reading",
            title: "Plan de lectura",
            description: "Recorrido anual",
            status: "ACTIVE",
            dueDate: "2026-08-01",
            parentGoalId: null
        },
        {
            id: "classics",
            title: "Clásicos argentinos",
            description: "Literatura nacional",
            status: "COMPLETED",
            dueDate: "2026-07-27",
            parentGoalId: "reading"
        },
        {
            id: "writing",
            title: "Taller de escritura",
            description: "Producción creativa",
            status: "ARCHIVED",
            dueDate: null,
            parentGoalId: null
        }
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
        goalIds: overrides.goalIds ?? [],
        priority: overrides.priority ?? 0,
        startDate: overrides.startDate ?? null,
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
        attachments: overrides.attachments ?? [],
        notionPageId: overrides.notionPageId ?? null,
        notionPageUrl: overrides.notionPageUrl ?? null
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

test("filtra tareas según tengan una nota de Notion vinculada", () => {

    const linked = task({
        notionPageId: "notion-page",
        notionPageUrl:
            "https://www.notion.so/notion-page"
    });
    const incompleteLink = task({
        notionPageId: "notion-page"
    });

    assert.equal(matches(linked, "tieneNota:sí"), true);
    assert.equal(matches(linked, "tieneNota:no"), false);
    assert.equal(
        matches(incompleteLink, "tieneNota:sí"),
        false
    );
    assert.equal(
        matches(incompleteLink, "hasNote:false"),
        true
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

test("busca objetivos directos con coincidencia parcial normalizada", () => {

    const item = task({
        goalIds: ["classics"]
    });

    assert.equal(
        matches(item, "objetivo:clasicos"),
        true
    );
    assert.equal(
        matches(item, "objetivo:lectura"),
        false
    );
    assert.equal(
        matches(item, "goal:ARGENTINOS"),
        true
    );

});

test("la búsqueda jerárquica incluye subobjetivos", () => {

    const item = task({
        goalIds: ["classics"]
    });

    assert.equal(
        matches(
            item,
            "objetivoJerarquia:lectura"
        ),
        true
    );
    assert.equal(
        matches(
            item,
            "goalHierarchy:escritura"
        ),
        false
    );

});

test("detecta tareas con o sin objetivos", () => {

    assert.equal(
        matches(
            task({ goalIds: ["writing"] }),
            "tieneObjetivos:si"
        ),
        true
    );
    assert.equal(
        matches(
            task(),
            "hasGoals:no"
        ),
        true
    );

});

test("busca propiedades de los objetivos asociados", () => {

    const item = task({
        goalIds: ["classics"]
    });

    assert.equal(
        matches(
            item,
            "objetivoDescripcion:nacional AND objetivoEstado:completado"
        ),
        true
    );
    assert.equal(
        matches(
            item,
            "objetivoFecha:hoy AND objetivoNivel:subobjetivo"
        ),
        true
    );
    assert.equal(
        matches(
            item,
            "goalLevel:root OR goalStatus:active"
        ),
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

test("busca por fecha de inicio sin confundirla con el vencimiento", () => {

    const item = task({
        startDate: "2026-08-01",
        dueDate: "2026-08-15"
    });

    assert.equal(
        matches(
            item,
            "inicio:2026-08-01 AND fecha:2026-08-15"
        ),
        true
    );

    assert.equal(
        matches(item, "inicio:2026-08-15"),
        false
    );

});

test("compara límites y períodos de la fecha de inicio", () => {

    const item = task({
        startDate: "2026-08-01"
    });

    assert.equal(
        matches(
            item,
            'inicioDespues:hoy AND inicioAntes:2026-08-10 AND inicioDentro:"7 dias"'
        ),
        true
    );

    assert.equal(
        matches(
            item,
            'inicioEntre:"2026-08-01,2026-08-31"'
        ),
        true
    );

});

test("busca tareas activas durante un período por solapamiento", () => {

    for (const item of [
        task({
            startDate: "2026-07-20",
            dueDate: "2026-08-03"
        }),
        task({
            startDate: "2026-08-05",
            dueDate: "2026-08-20"
        }),
        task({
            startDate: "2026-07-01",
            dueDate: "2026-09-01"
        }),
        task({
            startDate: "2026-08-01",
            dueDate: "2026-08-07"
        })
    ]) {
        assert.equal(
            matches(
                item,
                "activaEn:2026-08-01..2026-08-07"
            ),
            true
        );
    }

});

test("acepta fechas locales en un período activo", () => {

    assert.equal(
        matches(
            task({
                startDate: "2026-08-10",
                dueDate: "2026-08-15"
            }),
            "activaEn:11/08/2026..13/08/2026"
        ),
        true
    );

});

test("excluye tareas cuyo período operativo no se superpone", () => {

    assert.equal(
        matches(
            task({
                startDate: "2026-07-01",
                dueDate: "2026-07-31"
            }),
            "activaEn:2026-08-01..2026-08-07"
        ),
        false
    );

    assert.equal(
        matches(
            task({
                startDate: "2026-08-08",
                dueDate: "2026-08-20"
            }),
            "activeIn:2026-08-01..2026-08-07"
        ),
        false
    );

});

test("trata fechas operativas ausentes como límites abiertos", () => {

    for (const item of [
        task({ dueDate: "2026-08-03" }),
        task({ startDate: "2026-08-05" })
    ]) {
        assert.equal(
            matches(
                item,
                "activaEn:2026-08-01..2026-08-07"
            ),
            true
        );
    }

    assert.equal(
        matches(
            task({ dueDate: "2026-07-31" }),
            "activaEn:2026-08-01..2026-08-07"
        ),
        false
    );

    assert.equal(
        matches(
            task({ startDate: "2026-08-08" }),
            "activaEn:2026-08-01..2026-08-07"
        ),
        false
    );

    assert.equal(
        matches(
            task(),
            "activaEn:2026-08-01..2026-08-07"
        ),
        false
    );

});

test("trata cada tarea recurrente como una ocurrencia en su vencimiento", () => {

    assert.equal(
        matches(
            task({
                dueDate: "2026-08-18",
                recurrence: "WEEKLY"
            }),
            "activaEn:2026-08-11..2026-08-13"
        ),
        false
    );

    assert.equal(
        matches(
            task({
                dueDate: "2026-08-12",
                recurrence: "WEEKLY"
            }),
            "activaEn:2026-08-11..2026-08-13"
        ),
        true
    );

});

test("acepta fechas relativas y rechaza rangos activos inválidos", () => {

    assert.equal(
        matches(
            task({
                startDate: "2026-07-27",
                dueDate: "2026-08-03"
            }),
            'activaEn:"hoy..en 7 dias"'
        ),
        true
    );

    assert.equal(
        matches(
            task(),
            "activaEn:2026-08-07..2026-08-01"
        ),
        false
    );

});

test("detecta tareas con o sin fecha de inicio", () => {

    assert.equal(
        matches(
            task({ startDate: "2026-08-01" }),
            "tieneInicio:si"
        ),
        true
    );

    assert.equal(
        matches(task(), "hasStartDate:no"),
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

test("detecta subtareas y tipo de recurrencia", () => {

    const item = task({
        parentTaskId: "parent",
        recurrence: "WEEKLY"
    });

    assert.equal(
        matches(
            item,
            "esSubtarea:si AND repeticion:semanal"
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


test("busca vencimientos entre dos fechas inclusivas", () => {

    for (const dueDate of [
        "2026-08-01",
        "2026-08-15",
        "2026-08-31"
    ]) {
        assert.equal(
            matches(
                task({ dueDate }),
                'fechaEntre:"2026-08-01,2026-08-31"'
            ),
            true
        );
    }

    assert.equal(
        matches(
            task({ dueDate: "2026-09-01" }),
            'venceEntre:"2026-08-01,2026-08-31"'
        ),
        false
    );

});

test("busca creación, actualización y finalización entre fechas", () => {

    const item = task({
        createdAt:
            "2026-07-05T10:00:00.000Z",
        updatedAt:
            "2026-07-15T10:00:00.000Z",
        completedAt:
            "2026-07-31T10:00:00.000Z"
    });

    assert.equal(
        matches(
            item,
            'creadaEntre:"2026-07-01,2026-07-31" AND actualizadaEntre:"2026-07-01,2026-07-31" AND completadaEntre:"2026-07-01,2026-07-31"'
        ),
        true
    );

});

test("acepta los sinónimos de vencimiento", () => {

    const item = task({
        dueDate: "2026-08-15"
    });

    assert.equal(
        matches(
            item,
            "venceDespues:2026-08-01 AND venceAntes:2026-09-01"
        ),
        true
    );

});


test("acepta fechas en formato argentino", () => {

    const item = task({
        dueDate: "2026-08-15"
    });

    assert.equal(
        matches(item, "fecha:15/08"),
        true
    );

    assert.equal(
        matches(item, "fecha:15/08/26"),
        true
    );

    assert.equal(
        matches(item, "fecha:15/08/2026"),
        true
    );

});

test("acepta fechas relativas y días de la semana", () => {

    assert.equal(
        matches(
            task({ dueDate: "2026-07-30" }),
            'fecha:"en 3 dias"'
        ),
        true
    );

    assert.equal(
        matches(
            task({ dueDate: "2026-07-31" }),
            "fecha:viernes"
        ),
        true
    );

    assert.equal(
        matches(
            task({ dueDate: "2026-08-10" }),
            'fecha:"en 2 semanas"'
        ),
        true
    );

});

test("admite rangos con formato argentino", () => {

    assert.equal(
        matches(
            task({ dueDate: "2026-08-15" }),
            'venceEntre:"01/08,31/08"'
        ),
        true
    );

});
