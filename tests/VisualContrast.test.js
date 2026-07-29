import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const styles = fs.readFileSync(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

function readColorToken(name) {
    const match = styles.match(
        new RegExp(`--${name}:\\s*(#[0-9a-f]{3,6})`, "i")
    );

    assert.ok(match, `Falta el token --${name}.`);
    return match[1];
}

function relativeLuminance(hexColor) {
    const normalized =
        hexColor.length === 4
            ? hexColor
                  .slice(1)
                  .split("")
                  .map(character => character.repeat(2))
                  .join("")
            : hexColor.slice(1);
    const channels = normalized
        .match(/.{2}/g)
        .map(channel => parseInt(channel, 16) / 255)
        .map(channel =>
            channel <= 0.04045
                ? channel / 12.92
                : ((channel + 0.055) / 1.055) ** 2.4
        );

    return (
        0.2126 * channels[0] +
        0.7152 * channels[1] +
        0.0722 * channels[2]
    );
}

function contrastRatio(firstColor, secondColor) {
    const luminances = [
        relativeLuminance(firstColor),
        relativeLuminance(secondColor)
    ].sort((first, second) => second - first);

    return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

test("los textos estructurales alcanzan contraste AA sobre la superficie", () => {
    const surface = readColorToken("color-surface");

    for (const token of [
        "color-text",
        "color-text-secondary",
        "color-text-muted",
        "color-accent",
        "color-danger"
    ]) {
        assert.ok(
            contrastRatio(readColorToken(token), surface) >= 4.5,
            `${token} no alcanza contraste AA.`
        );
    }
});

test("los bordes de controles y el foco se distinguen de la superficie", () => {
    const surface = readColorToken("color-surface");

    for (const token of [
        "color-border-strong",
        "color-focus-ring"
    ]) {
        assert.ok(
            contrastRatio(readColorToken(token), surface) >= 3,
            `${token} no alcanza contraste de interfaz.`
        );
    }
});

test("el texto de acciones primarias contrasta con el fondo de acento", () => {
    assert.ok(
        contrastRatio(
            readColorToken("color-on-accent"),
            readColorToken("color-accent")
        ) >= 4.5
    );
    assert.match(
        styles,
        /\.createActionButton\s*\{[\s\S]*?color:\s*var\(--color-on-accent\)/
    );
});
