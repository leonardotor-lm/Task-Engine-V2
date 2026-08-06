import test from "node:test";
import assert from "node:assert/strict";
import {
    compileAttachmentSearch,
    matchesAttachmentSearch
} from "../src/core/AttachmentSearch.js";

const pdf = {
    id: "attachment-1",
    name: "Presupuesto.pdf",
    mimeType: "application/pdf"
};

test("combina espera con búsqueda de adjuntos", () => {

    const expression = compileAttachmentSearch(
        "enEspera:si AND adjunto:pdf"
    ).expression;

    assert.equal(
        matchesAttachmentSearch(
            {
                title: "Esperar presupuesto",
                isWaiting: true,
                attachments: [pdf]
            },
            expression
        ),
        true
    );

    assert.equal(
        matchesAttachmentSearch(
            {
                title: "Documento disponible",
                isWaiting: false,
                attachments: [pdf]
            },
            expression
        ),
        false
    );

});

test("rechaza valores inválidos para enEspera", () => {

    assert.throws(
        () => compileAttachmentSearch(
            "enEspera:quizás"
        ),
        /debe ser sí o no/
    );

});
