import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
    dirname(fileURLToPath(import.meta.url)),
    ".."
);

test("tareas en espera usan tokens semanticos de tema", async () => {
    const css = await readFile(
        resolve(ROOT, "styles/waiting.css"),
        "utf8"
    );

    assert.match(css, /border:\s*1px solid var\(--color-border\)/);
    assert.match(css, /background:\s*var\(--color-surface-subtle\)/);
    assert.match(css, /border-left:\s*3px solid var\(--color-text-muted\)/);
    assert.match(css, /color:\s*var\(--color-text-secondary\)/);
    assert.doesNotMatch(css, /rgba?\(/i);
    assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
});
