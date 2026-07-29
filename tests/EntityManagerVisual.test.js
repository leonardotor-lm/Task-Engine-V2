import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { EntityManager } from "../src/ui/EntityManager.js";

const styles = await readFile(
    new URL(
        "../styles.css",
        import.meta.url
    ),
    "utf8"
);

test("la creación de entidades permanece bajo demanda", () => {

    for (const [title, label] of [
        ["Áreas", "Nueva área"],
        ["Contextos", "Nuevo contexto"],
        ["Etiquetas", "Nueva etiqueta"]
    ]) {

        const html =
            new EntityManager().render(
                title
            );

        assert.match(
            html,
            /<details class="entityCreateManager">/
        );

        assert.match(
            html,
            new RegExp(label)
        );

    }

});

test("editar usa un ícono accesible y eliminar conserva texto", () => {

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
        /class="editEntity iconButton"/
    );

    assert.match(
        html,
        /aria-label="Editar Trabajo"/
    );

    assert.match(
        html,
        /class="[^"]*\bdeleteEntity\b[^"]*"[\s\S]*?Eliminar/
    );

});

test("los gestores usan filas y formularios compactos", () => {

    assert.match(
        styles,
        /\/\* Ajustes finales de los gestores de entidades \*\//
    );

    assert.match(
        styles,
        /\.entityManager \.entityItem\s*\{[\s\S]*?padding:\s*6px 0/
    );

});
