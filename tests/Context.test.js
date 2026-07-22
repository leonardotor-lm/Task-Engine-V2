import test from "node:test";
import assert from "node:assert/strict";

import { Context } from "../src/domain/Context.js";

test("crea un contexto con nombre y color", () => {

    const context = new Context({
        name: "Computadora",
        color: "#22c55e"
    });

    assert.equal(context.name, "Computadora");
    assert.equal(context.color, "#22c55e");

});

test("no permite crear un contexto sin nombre", () => {

    assert.throws(
        () => new Context({ name: "   " }),
        {
            message: "El nombre del contexto no puede estar vacío."
        }
    );

});