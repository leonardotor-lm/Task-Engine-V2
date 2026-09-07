import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const index = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8"
);
const styles = await readFile(
    new URL("../styles/mobile-density.css", import.meta.url),
    "utf8"
);
const controller = await readFile(
    new URL(
        "../src/ui/MobileMainLayoutController.js",
        import.meta.url
    ),
    "utf8"
);
const compactToolbarController = await readFile(
    new URL(
        "../src/ui/CompactTaskToolbarController.js",
        import.meta.url
    ),
    "utf8"
);
const editorController = await readFile(
    new URL(
        "../src/ui/UnifiedMobileTaskEditorController.js",
        import.meta.url
    ),
    "utf8"
);
const editorDensity = await readFile(
    new URL(
        "../styles/task-editor-mobile-density.css",
        import.meta.url
    ),
    "utf8"
);
const editorDeviceFixes = await readFile(
    new URL(
        "../styles/task-editor-mobile-device-fixes.css",
        import.meta.url
    ),
    "utf8"
);

test("la interfaz móvil carga la capa de densidad al final de los estilos funcionales", () => {
    assert.match(
        index,
        /styles\/task-checkbox-alignment\.css[\s\S]*styles\/mobile-density\.css/
    );
});

test("la cabecera móvil reutiliza el nombre de la vista y oculta el título duplicado", () => {
    assert.match(
        controller,
        /syncMobileViewTitle\(\)/
    );
    assert.match(
        controller,
        /\.taskListHeading h2/
    );
    assert.match(
        styles,
        /\.mobileHeader strong\s*\{[\s\S]*?font-size:\s*18px;[\s\S]*?font-weight:\s*700;/
    );
    assert.match(
        styles,
        /\.taskListTitleSummary > h2\s*\{[\s\S]*?display:\s*none;/
    );
});

test("la lista móvil elimina separadores y destaca los encabezados de agrupación", () => {
    assert.match(
        styles,
        /\.task\s*\{[\s\S]*?border-bottom:\s*0 !important;/
    );
    assert.match(
        styles,
        /\.taskGroupHeader\s*\{[\s\S]*?font-size:\s*14px;[\s\S]*?font-weight:\s*700;/
    );
});

test("los controles icónicos móviles pierden el contorno y la barra se compacta", () => {
    assert.match(
        styles,
        /\.mobileMenuButton\s*\{[\s\S]*?width:\s*38px;[\s\S]*?border:\s*0;/
    );
    assert.match(
        styles,
        /#taskContextToolbar\[data-viewport-mode="mobile"\][\s\S]*?button,[\s\S]*?border:\s*0 !important;[\s\S]*?background:\s*transparent !important;/
    );
    assert.match(
        styles,
        /\.quickMoreMenu\s*\{[\s\S]*?gap:\s*4px;[\s\S]*?padding:\s*8px;/
    );
});

test("la navegación móvil evita fondos permanentes sin imponer la geometría del tema", () => {
    const rule = styles.match(
        /\.sidebarButton:not\(\.active\)\s*\{([^}]*)\}/
    );

    assert.ok(rule);
    assert.match(
        rule[1],
        /background-color:\s*transparent !important;/
    );
    assert.doesNotMatch(rule[1], /border(?:-radius)?\s*:/);
    assert.match(
        styles,
        /\.sidebarButton:not\(\.active\):active\s*\{[\s\S]*?background-color:\s*var\(--color-surface-hover\) !important;/
    );
});

test("el chevron móvil se integra luego de que exista el resumen de la vista", () => {
    assert.match(
        compactToolbarController,
        /queueMicrotask\([\s\S]*?decorateHeadingToggle/
    );
    assert.match(
        compactToolbarController,
        /items\.append\(button\)/
    );
    assert.match(
        styles,
        /mobileTaskToolbarHeadingToggleReady[\s\S]*?mobileTaskToolbarToggle[\s\S]*?display:\s*none !important;/
    );
});

test("el editor móvil carga las capas compacta, de densidad y de dispositivo", () => {
    assert.match(
        editorController,
        /task-editor-mobile-density\.css/
    );
    assert.match(
        editorController,
        /task-editor-mobile-device-fixes\.css/
    );
    assert.match(
        editorController,
        /COMPACT_STYLESHEET,[\s\S]*DENSITY_STYLESHEET,[\s\S]*DEVICE_FIXES_STYLESHEET/
    );
});

test("el editor móvil compacta iconos y deja la descripción en una línea inicial", () => {
    assert.match(
        editorDensity,
        /#taskDescriptionEdit\s*\{[\s\S]*?height:\s*42px;[\s\S]*?min-height:\s*42px;/
    );
    assert.match(
        editorDensity,
        /mobileTaskEditorCompactSummary,[\s\S]*?min-height:\s*60px;[\s\S]*?border:\s*0 !important;/
    );
    assert.match(
        editorDensity,
        /taskEditorHeader button,[\s\S]*?border:\s*0 !important;[\s\S]*?background:\s*transparent !important;/
    );
});

test("los popovers del editor móvil comparten densidad y cabecera", () => {
    assert.ok(editorDensity.includes("gap: 6px !important;"));
    assert.ok(editorDensity.includes("padding: 0 10px 10px !important;"));
    assert.ok(editorDensity.includes("min-height: 42px !important;"));
    assert.ok(editorDensity.includes("padding: 2px 6px 2px 10px !important;"));
    assert.ok(editorDensity.includes("width: 38px !important;"));
    assert.ok(editorDensity.includes("height: 38px !important;"));
});

test("los popovers reducen espacios internos sin achicar en exceso los campos", () => {
    assert.ok(editorDensity.includes("padding: 7px 9px !important;"));
    assert.ok(editorDensity.includes("gap: 2px !important;"));
    assert.ok(editorDensity.includes("padding-bottom: 4px !important;"));
    assert.ok(editorDensity.includes("padding: 8px 10px 10px !important;"));
});

test("los ajustes de dispositivo mantienen cabecera arriba y adjuntos dentro del panel", () => {
    assert.match(
        editorDeviceFixes,
        /mobileTaskEditorCompactPanelHeader[\s\S]*?order:\s*-100 !important;/
    );
    assert.match(
        editorDeviceFixes,
        /attachmentUploadControl[\s\S]*?box-sizing:\s*border-box !important;[\s\S]*?width:\s*100% !important;[\s\S]*?max-width:\s*100% !important;/
    );
});

test("un popover abierto oculta las acciones globales del editor móvil", () => {
    assert.match(
        editorDeviceFixes,
        /:has\([\s\S]*mobileTaskEditorCompactTransient\[open\][\s\S]*\)[\s\S]*mobileTaskEditorFooter[\s\S]*visibility:\s*hidden !important;[\s\S]*pointer-events:\s*none !important;/
    );
});
