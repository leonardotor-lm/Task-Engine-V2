import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
    dirname(fileURLToPath(import.meta.url)),
    ".."
);

test("estadisticas usa el token semantico de superficie sutil", async () => {
    const css = await readFile(
        resolve(ROOT, "styles/statistics.css"),
        "utf8"
    );

    assert.match(
        css,
        /\.statisticsIndicators article[\s\S]*background:\s*var\(--color-surface-subtle\)/
    );
    assert.match(
        css,
        /\.statisticsSectionHeading span[\s\S]*background:\s*var\(--color-surface-subtle\)/
    );
    assert.doesNotMatch(css, /--color-surface-soft\b/);
});
