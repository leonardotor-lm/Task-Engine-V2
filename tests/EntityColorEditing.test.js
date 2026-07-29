import test from "node:test";
import assert from "node:assert/strict";

import { Area } from "../src/domain/Area.js";
import { Context } from "../src/domain/Context.js";
import { Tag } from "../src/domain/Tag.js";
import { EntityManager } from "../src/ui/EntityManager.js";

test("muestra nombre y color actuales en el editor de entidades", () => {

    const html = new EntityManager().render(
        "Áreas",
        [{
            id: "area-1",
            name: "Trabajo",
            color: "#3b82f6"
        }]
    );

    assert.match(
        html,
        /class="entityEditForm"/
    );

    assert.match(
        html,
        /class="entityEditName"[\s\S]*value="Trabajo"/
    );

    assert.match(
        html,
        /class="entityEditColor"[\s\S]*value="#3b82f6"/
    );

    assert.match(
        html,
        /class="[^"]*\bcancelEntityEdit\b[^"]*"/
    );

});

test("áreas contextos y etiquetas aceptan un nuevo color", () => {

    const entities = [
        new Area({
            name: "Trabajo",
            color: "#3b82f6"
        }),
        new Context({
            name: "Escuela",
            color: "#22c55e"
        }),
        new Tag({
            name: "Urgente",
            color: "#a855f7"
        })
    ];

    for (const entity of entities) {

        entity.update({
            name: entity.name,
            color: "#ef4444"
        });

        assert.equal(
            entity.color,
            "#ef4444"
        );

    }

});
