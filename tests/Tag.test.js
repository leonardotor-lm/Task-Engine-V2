import test from "node:test";
import assert from "node:assert/strict";

import { Tag } from "../src/domain/Tag.js";

test("crea una etiqueta con nombre y color", () => {

    const tag = new Tag({
        name: "Urgente",
        color: "#a855f7"
    });

    assert.equal(tag.name, "Urgente");
    assert.equal(tag.color, "#a855f7");

});

test("no permite crear una etiqueta sin nombre", () => {

    assert.throws(
        () => new Tag({ name: "   " }),
        {
            message: "El nombre de la etiqueta no puede estar vacío."
        }
    );

});

test("actualiza una etiqueta", () => {

    const tag = new Tag({ name: "Lectura" });

    tag.update({
        name: "Libros",
        color: "#ef4444"
    });

    assert.equal(tag.name, "Libros");
    assert.equal(tag.color, "#ef4444");

});
