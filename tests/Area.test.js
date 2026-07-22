import test from "node:test";
import assert from "node:assert/strict";

import { Area } from "../src/domain/Area.js";

test("crea un área con nombre y color", () => {

    const area = new Area({
        name: "Escuela",
        color: "#3b82f6"
    });

    assert.equal(area.name, "Escuela");
    assert.equal(area.color, "#3b82f6");

});

test("no permite crear un área sin nombre", () => {

    assert.throws(
        () => new Area({ name: "   " }),
        {
            message: "El nombre del área no puede estar vacío."
        }
    );

});