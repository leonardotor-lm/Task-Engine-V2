import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
    dirname(fileURLToPath(import.meta.url)),
    ".."
);

function getStylesheetHrefs(html) {

    return Array.from(
        html.matchAll(
            /<link\s+rel="stylesheet"\s+href="([^"]+)"/g
        ),
        match => match[1]
    );

}

test("index carga únicamente hojas CSS existentes y en el orden previsto", async () => {

    const index = await readFile(
        resolve(ROOT, "index.html"),
        "utf8"
    );
    const hrefs = getStylesheetHrefs(index);

    assert.deepEqual(
        hrefs,
        [
            "styles.css",
            "attachments.css",
            "waiting.css",
            "styles/task-interface.css",
            "styles/task-editor-desktop.css"
        ]
    );

    await Promise.all(
        hrefs.map(href =>
            access(resolve(ROOT, href))
        )
    );

});

test("la hoja consolidada conserva los tres bloques funcionales", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/task-interface.css"),
        "utf8"
    );

    assert.match(styles, /\.taskContextToolbar\s*\{/);
    assert.match(styles, /\.sidebar \.sidebarUnifiedGroup/);
    assert.match(styles, /\.mobileFloatingTaskButton\s*\{/);

    const withoutComments = styles.replace(
        /\/\*[\s\S]*?\*\//g,
        ""
    );
    const openingBraces =
        withoutComments.match(/\{/g)?.length ?? 0;
    const closingBraces =
        withoutComments.match(/\}/g)?.length ?? 0;

    assert.equal(openingBraces, closingBraces);

});

test("la hoja del editor conserva el alcance exclusivo de escritorio", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/task-editor-desktop.css"),
        "utf8"
    );

    assert.match(
        styles,
        /@media\s*\(min-width:\s*761px\)/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorLayout/
    );

    const withoutComments = styles.replace(
        /\/\*[\s\S]*?\*\//g,
        ""
    );
    const openingBraces =
        withoutComments.match(/\{/g)?.length ?? 0;
    const closingBraces =
        withoutComments.match(/\}/g)?.length ?? 0;

    assert.equal(openingBraces, closingBraces);

});

test("index no conserva referencias a las hojas transitorias", async () => {

    const index = await readFile(
        resolve(ROOT, "index.html"),
        "utf8"
    );

    assert.doesNotMatch(index, /task-toolbar\.css/);
    assert.doesNotMatch(index, /task-toolbar-layout\.css/);
    assert.doesNotMatch(index, /mobile-main-layout\.css/);

});
