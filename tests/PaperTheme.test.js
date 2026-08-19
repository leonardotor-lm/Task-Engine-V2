import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Papel usa una paleta clara cálida sin redefinir tipografía ni geometría", async () => {

    const source = await readFile(
        new URL(
            "../styles/themes/paper.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /:root\[data-theme="paper"\]/
    );
    assert.match(source, /--color-surface: #f3efe4/);
    assert.match(
        source,
        /--color-surface-subtle: #e9e2d3/
    );
    assert.match(source, /--color-text: #2f312f/);
    assert.match(source, /--color-accent: #456b67/);

    assert.doesNotMatch(source, /font-family\s*:/);
    assert.doesNotMatch(source, /font-size\s*:/);
    assert.doesNotMatch(source, /line-height\s*:/);
    assert.doesNotMatch(source, /border-radius\s*:/);
    assert.doesNotMatch(source, /\bpadding\s*:/);
    assert.doesNotMatch(source, /\bmargin\s*:/);
}
