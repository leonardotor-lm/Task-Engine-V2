import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const theme = await readFile(
    new URL(
        "../styles/themes/high-contrast.css",
        import.meta.url
    ),
    "utf8"
);

test("Alto contraste define una paleta clara de máxima legibilidad", () => {

    assert.match(theme, /:root\[data-theme="high-contrast"\]/);
    assert.match(theme, /--color-surface:\s*#ffffff/);
    assert.match(theme, /--color-text:\s*#111111/);
    assert.match(theme, /--color-border-strong:\s*#222222/);
    assert.match(theme, /--color-accent:\s*#005fcc/);
    assert.match(theme, /--color-danger:\s*#b00020/);
    assert.match(theme, /--color-focus-ring:\s*#0066ff/);

});

test("Alto contraste refuerza foco y controles sin cambiar geometría base", () => {

    assert.match(
        theme,
        /:root\[data-theme="high-contrast"\] :focus-visible[\s\S]*outline:\s*3px solid var\(--color-focus-ring\)/
    );
    assert.match(
        theme,
        /\.taskCompleteCheckbox[\s\S]*border-width:\s*2px/
    );
    assert.doesNotMatch(theme, /font-family\s*:/);
    assert.doesNotMatch(theme, /font-size\s*:/);

});
