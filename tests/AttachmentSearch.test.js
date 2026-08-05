import test from "node:test";
import assert from "node:assert/strict";
import {
    compileAttachmentSearch,
    filterTaskTreeByAttachmentSearch,
    matchesAttachmentSearch
} from "../src/core/AttachmentSearch.js";

const pdf = {
    id: "a1",
    name: "Programa Literatura.pdf",
    mimeType: "application/pdf"
};
const image = {
    id: "a2",
    name: "captura.png",
    mimeType: "image/png"
};

function compile(query) {
    return compileAttachmentSearch(query).expression;
}

test("detecta tareas con adjuntos", () => {
    const expression = compile("tieneadjuntos:sí");
    assert.equal(
        matchesAttachmentSearch(
            { attachments: [pdf] },
            expression
        ),
        true
    );
    assert.equal(
        matchesAttachmentSearch(
            { attachments: [] },
            expression
        ),
        false
    );
});

test("busca por nombre o tipo de archivo", () => {
    const byName = compile('adjunto:"literatura"');
    const byType = compile("attachment:png");
    assert.equal(
        matchesAttachmentSearch(
            { attachments: [pdf] },
            byName
        ),
        true
    );
    assert.equal(
        matchesAttachmentSearch(
            { attachments: [image] },
            byType
        ),
        true
    );
});

test("mantiene AND, OR y NOT", () => {
    const expression = compile(
        "(titulo:clase AND adjunto:pdf) OR NOT tieneadjuntos:sí"
    );
    assert.equal(matchesAttachmentSearch({
        title: "Preparar clase",
        attachments: [pdf]
    }, expression), true);
    assert.equal(matchesAttachmentSearch({
        title: "Comprar",
        attachments: [pdf]
    }, expression), false);
    assert.equal(matchesAttachmentSearch({
        title: "Comprar",
        attachments: []
    }, expression), true);
});

test("conserva padres de coincidencias", () => {
    const tasks = [
        {
            id: "parent",
            parentTaskId: null,
            title: "Proyecto",
            attachments: []
        },
        {
            id: "child",
            parentTaskId: "parent",
            title: "Documento",
            attachments: [pdf]
        },
        {
            id: "other",
            parentTaskId: null,
            title: "Otra",
            attachments: []
        }
    ];
    const filtered = filterTaskTreeByAttachmentSearch(
        tasks,
        compile("adjunto:pdf")
    );
    assert.deepEqual(
        filtered.map(task => task.id),
        ["parent", "child"]
    );
});

test("rechaza booleanos inválidos", () => {
    assert.throws(
        () => compileAttachmentSearch(
            "tieneadjuntos:quizás"
        ),
        /debe ser sí o no/
    );
});
