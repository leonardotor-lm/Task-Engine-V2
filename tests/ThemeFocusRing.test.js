import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
    dirname(fileURLToPath(import.meta.url)),
    ".."
);

test("los focos de navegacion usan el token semantico del tema", async () => {

    const [goalWorkspace, quickActions] = await Promise.all([
        readFile(resolve(ROOT, "styles/goal-workspace.css"), "utf8"),
        readFile(resolve(ROOT, "styles/task-quick-actions.css"), "utf8")
    ]);

    assert.match(
        goalWorkspace,
        /goalBreadcrumbLink:focus-visible[\s\S]*outline:\s*2px solid var\(--color-focus-ring\)/
    );
    assert.match(
        quickActions,
        /quickPostponeDate:focus-visible[\s\S]*outline:\s*2px solid var\(--color-focus-ring\)/
    );

});
