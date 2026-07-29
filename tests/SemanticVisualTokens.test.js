import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const styles = await readFile(
    new URL(
        "../styles.css",
        import.meta.url
    ),
    "utf8"
);

test("define una paleta semántica para el tema principal", () => {

    for (const token of [
        "--color-text",
        "--color-text-secondary",
        "--color-text-muted",
        "--color-surface",
        "--color-border",
        "--color-border-strong",
        "--color-accent",
        "--color-accent-strong",
        "--color-accent-soft",
        "--color-danger"
    ]) {

        assert.match(
            styles,
            new RegExp(`${token}:`)
        );

    }

});

test("los componentes reutilizan los tokens visuales", () => {

    const uses = (
        styles.match(
            /var\(--color-[a-z-]+\)/g
        ) ?? []
    ).length;

    assert.ok(
        uses >= 200,
        `Se esperaban al menos 200 usos y se encontraron ${uses}.`
    );

});
