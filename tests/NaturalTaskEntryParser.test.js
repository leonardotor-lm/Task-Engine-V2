import test from "node:test";
import assert from "node:assert/strict";
import {
    parseNaturalTaskEntry
} from "../src/core/NaturalTaskEntryParser.js";

const options = {
    today: "2026-09-14",
    areas: [
        { id: "area-personal", name: "Personal" },
        { id: "area-docencia", name: "Trabajo docente" }
    ],
    contexts: [
        { id: "context-casa", name: "Casa" }
    ],
    tags: [
        { id: "tag-tramites", name: "Trámites" },
        { id: "tag-escuela", name: "Escuela" }
    ]
};

test("interpreta una tarea breve sin usar IA", () => {
    const result = parseNaturalTaskEntry(
        "Pagar seguro del auto el viernes a las 18 prioridad alta #trámites /Personal @Casa",
        options
    );

    assert.equal(result.title, "Pagar seguro del auto");
    assert.equal(result.dueDate, "2026-09-18");
    assert.equal(result.dueTime, "18:00");
    assert.equal(result.priority, 3);
    assert.equal(result.areaId, "area-personal");
    assert.equal(result.contextId, "context-casa");
    assert.deepEqual(result.tagIds, ["tag-tramites"]);
    assert.equal(result.warnings.length, 0);
});

test("distingue un área con barra de una fecha numérica", () => {
    const result = parseNaturalTaskEntry(
        "Entregar formulario el 15/9 /Trabajo docente",
        options
    );

    assert.equal(result.title, "Entregar formulario");
    assert.equal(result.dueDate, "2026-09-15");
    assert.equal(result.areaId, "area-docencia");
});

test("acepta fecha relativa, hora y prioridad abreviada", () => {
    const result = parseNaturalTaskEntry(
        "Llamar al médico mañana 09:30 !crítica",
        options
    );

    assert.equal(result.title, "Llamar al médico");
    assert.equal(result.dueDate, "2026-09-15");
    assert.equal(result.dueTime, "09:30");
    assert.equal(result.priority, 4);
});

test("la prioridad numérica usa uno como nivel más alto", () => {
    const cases = [
        ["!1", 4],
        ["!2", 3],
        ["!3", 2],
        ["!4", 1]
    ];

    for (const [token, expected] of cases) {
        const result = parseNaturalTaskEntry(
            `Resolver trámite ${token}`,
            options
        );

        assert.equal(result.title, "Resolver trámite");
        assert.equal(result.priority, expected);
    }
});

test("una fecha sin año avanza al año siguiente si ya pasó", () => {
    const result = parseNaturalTaskEntry(
        "Renovar permiso el 10/9",
        options
    );

    assert.equal(result.title, "Renovar permiso");
    assert.equal(result.dueDate, "2027-09-10");
});

test("no interpreta áreas, contextos ni etiquetas inexistentes", () => {
    const result = parseNaturalTaskEntry(
        "Comprar pintura /Inventada @Calle #pendiente",
        options
    );

    assert.equal(
        result.title,
        "Comprar pintura /Inventada @Calle #pendiente"
    );
    assert.equal(result.areaId, null);
    assert.equal(result.contextId, null);
    assert.deepEqual(result.tagIds, []);
});

test("no decide entre dos áreas diferentes", () => {
    const result = parseNaturalTaskEntry(
        "Ordenar documentos /Personal /Trabajo docente",
        options
    );

    assert.equal(result.areaId, null);
    assert.match(result.warnings[0], /varias opciones/);
});

test("una barra dentro de una URL no se interpreta como área", () => {
    const result = parseNaturalTaskEntry(
        "Revisar https://ejemplo.com/Personal",
        options
    );

    assert.equal(result.areaId, null);
    assert.equal(result.title, "Revisar https://ejemplo.com/Personal");
});
