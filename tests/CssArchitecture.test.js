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
            "styles/task-editor-desktop.css",
            "styles/task-editor-popovers.css"
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

test("los popovers del editor quedan contenidos y muestran selecciones legibles", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/task-editor-popovers.css"),
        "utf8"
    );

    assert.match(
        styles,
        /@media\s*\(min-width:\s*761px\)/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorRecurrenceTool\[open\]/
    );
    assert.match(
        styles,
        /right:\s*0\s*!important/
    );
    assert.match(
        styles,
        /left:\s*auto\s*!important/
    );
    assert.match(
        styles,
        /max-width:\s*calc\(100vw\s*-\s*40px\)/
    );
    assert.match(
        styles,
        /grid-template-columns:[\s\S]*minmax\(0, 1fr\)[\s\S]*auto/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorPickerSelection[\s\S]*display:\s*grid/
    );
    assert.match(
        styles,
        /\.searchableMultiSelectChip[\s\S]*width:\s*100%/
    );
    assert.match(
        styles,
        /> span:not\(\.searchableMultiSelectColor\)[\s\S]*white-space:\s*normal/
    );
    assert.match(
        styles,
        /button\.searchableMultiSelectRemove[\s\S]*width:\s*18px\s*!important/
    );
    assert.match(
        styles,
        /\.postponeControls[\s\S]*> div[\s\S]*display:\s*grid/
    );
    assert.match(
        styles,
        /minmax\(142px,\s*0\.95fr\)/
    );
    assert.match(
        styles,
        /#postponeDate[\s\S]*min-width:\s*142px\s*!important/
    );
    assert.match(
        styles,
        /#postponeTask[\s\S]*min-width:\s*84px\s*!important/
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
