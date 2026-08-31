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
            "styles/themes/default.css",
            "styles/theme-settings.css",
            "styles/ai.css",
            "styles/attachments.css",
            "styles/waiting.css",
            "styles/task-interface.css",
            "styles/view-task-summary.css",
            "styles/mobile-filter-selects.css",
            "styles/mobile-task-toolbar.css",
            "styles/manual-task-order.css",
            "styles/task-quick-actions.css",
            "styles/task-editor-desktop.css",
            "styles/task-editor-popovers.css",
            "styles/task-editor-mobile.css",
            "styles/task-editor-mobile-compact.css",
            "styles/task-editor-mobile-density.css",
            "styles/task-editor-mobile-device-fixes.css",
            "styles/goal-workspace.css",
            "styles/statistics.css",
            "styles/task-checkbox-alignment.css",
            "styles/mobile-density.css",
            "styles/themes/retro-dark.css",
            "styles/themes/paper.css",
            "styles/themes/high-contrast.css",
            "styles/themes/ink-blue.css",
            "styles/themes/rose.css",
            "styles/themes/terminal-80.css"
        ]
    );

    await Promise.all(
        hrefs.map(href =>
            access(resolve(ROOT, href))
        )
    );

});

test("el documento declara explícitamente el tema predeterminado", async () => {

    const [index, theme] = await Promise.all([
        readFile(resolve(ROOT, "index.html"), "utf8"),
        readFile(
            resolve(ROOT, "styles/themes/default.css"),
            "utf8"
        )
    ]);

    assert.match(index, /<html[^>]*data-theme="default"/);
    assert.match(theme, /:root\[data-theme="default"\]/);
    assert.match(theme, /--color-surface:\s*#fff/);
    assert.match(theme, /--color-accent:\s*#2563eb/);
    assert.match(theme, /--interface-radius:\s*0/);
    assert.match(theme, /--transient-surface-shadow:/);

});

test("Retro Dark define una paleta propia y tipografía monoespaciada", async () => {

    const theme = await readFile(
        resolve(ROOT, "styles/themes/retro-dark.css"),
        "utf8"
    );

    assert.match(theme, /:root\[data-theme="retro-dark"\]/);
    assert.match(theme, /--color-surface-subtle:\s*#002b36/);
    assert.match(theme, /--color-surface:\s*#073642/);
    assert.match(theme, /--color-accent:\s*#2aa198/);
    assert.match(theme, /--ui-font:[\s\S]*ui-monospace/);

});

test("Terminal 80 usa fósforo verde y Source Code Pro", async () => {

    const theme = await readFile(
        resolve(ROOT, "styles/themes/terminal-80.css"),
        "utf8"
    );

    assert.match(theme, /:root\[data-theme="terminal-80"\]/);
    assert.match(theme, /--color-surface-subtle:\s*#07110a/);
    assert.match(theme, /--color-text:\s*#7cff6b/);
    assert.match(theme, /--color-accent:\s*#7cff6b/);
    assert.match(theme, /"Source Code Pro"/);
    assert.match(theme, /text-shadow:\s*0 0 3px/);

});

test("Papel usa una paleta clara cálida sin redefinir tipografía ni geometría", async () => {

    const theme = await readFile(
        resolve(ROOT, "styles/themes/paper.css"),
        "utf8"
    );

    assert.match(theme, /:root\[data-theme="paper"\]/);
    assert.match(theme, /--color-surface:\s*#f3efe4/);
    assert.match(theme, /--color-surface-subtle:\s*#e9e2d3/);
    assert.match(theme, /--color-text:\s*#2f312f/);
    assert.match(theme, /--color-accent:\s*#456b67/);

    assert.doesNotMatch(theme, /(^|[;{]\s*)font-family\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)font-size\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)line-height\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)border-radius\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)padding\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)margin\s*:/m);

});

test("Azul tinta usa una paleta fría sobria sin redefinir tipografía ni geometría", async () => {

    const theme = await readFile(
        resolve(ROOT, "styles/themes/ink-blue.css"),
        "utf8"
    );

    assert.match(theme, /:root\[data-theme="ink-blue"\]/);
    assert.match(theme, /--color-surface:\s*#f7f9fc/);
    assert.match(theme, /--color-surface-subtle:\s*#edf2f7/);
    assert.match(theme, /--color-text:\s*#16263a/);
    assert.match(theme, /--color-accent:\s*#315f8c/);

    assert.doesNotMatch(theme, /(^|[;{]\s*)font-family\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)font-size\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)line-height\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)border-radius\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)padding\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)margin\s*:/m);

});

test("la casilla de completar usa una alineación óptica común a todos los temas", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/task-checkbox-alignment.css"),
        "utf8"
    );

    assert.match(
        styles,
        /\.taskHeader\s*>\s*\.taskCompleteCheckbox\s*\{[\s\S]*?margin-top:\s*4px;/
    );
    assert.match(
        styles,
        /@media\s*\(max-width:\s*760px\)/
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

test("las acciones rápidas conservan el estilo del popover de posponer", async () => {

    const styles = await readFile(
        resolve(ROOT, "styles/task-quick-actions.css"),
        "utf8"
    );

    assert.match(styles, /\.quickPostponeMenu\s*\{/);
    assert.match(styles, /\.quickPostponePreset/);
    assert.match(styles, /\.applyQuickPostpone/);
    assert.match(styles, /var\(--transient-surface-border\)/);
    assert.match(styles, /var\(--transient-surface-shadow\)/);

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

test("index no conserva referencias a las hojas transitorias históricas", async () => {

    const index = await readFile(
        resolve(ROOT, "index.html"),
        "utf8"
    );

    assert.doesNotMatch(
        index,
        /href="styles\/task-toolbar\.css"/
    );
    assert.doesNotMatch(index, /task-toolbar-layout\.css/);
    assert.doesNotMatch(index, /mobile-main-layout\.css/);

});