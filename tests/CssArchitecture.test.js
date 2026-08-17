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
            "styles/mobile-filter-selects.css",
            "styles/manual-task-order.css",
            "styles/task-editor-desktop.css",
            "styles/task-editor-popovers.css",
            "styles/task-editor-mobile.css",
            "styles/goal-workspace.css",
            "styles/statistics.css"
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

test("los controles de actividad no expanden su altura en celular", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/task-interface.css"),
        "utf8"
    );

    assert.match(
        styles,
        /@media\s*\(max-width:\s*760px\)[\s\S]*?\.activityControls\s*\{[\s\S]*?flex:\s*0 0 auto;/
    );

});

test("la hoja compartida contiene la navegación jerárquica de objetivos y proyectos", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/goal-workspace.css"),
        "utf8"
    );

    assert.match(styles, /\.goalBreadcrumb/);
    assert.match(styles, /\.goalBreadcrumbLink/);
    assert.match(styles, /\.projectBreadcrumb/);
    assert.match(styles, /\.projectBreadcrumbLink/);

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
        /\.taskMoveManager\[open\][\s\S]*> \.desktopTaskEditorPopover/
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
        /\.desktopTaskEditorMoveTool[\s\S]*\.taskMoveManagerBody[\s\S]*width:\s*100%/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorMoveTool[\s\S]*button:not\(\.desktopTaskEditorPopoverClose\)[\s\S]*max-width:\s*100%\s*!important/
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
        /\.postponeControls[\s\S]*minmax\(142px, 0\.95fr\)/
    );
    assert.match(
        styles,
        /#postponeDate[\s\S]*min-width:\s*142px\s*!important/
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

test("la hoja móvil conserva alcance, jerarquía y paneles contenidos", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/task-editor-mobile.css"),
        "utf8"
    );

    assert.match(
        styles,
        /@media\s*\(max-width:\s*760px\)/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorLayout/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorProperties[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorToolGrid[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/
    );
    assert.match(
        styles,
        /details\[open\] > \.mobileTaskEditorPanel[\s\S]*position:\s*fixed/
    );
    assert.match(
        styles,
        /max-height:\s*min\(72dvh, 560px\)/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorHiddenSave/
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
