import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const enhancer = await readFile(
    new URL(
        "../src/ui/MobileTaskEditorCompactEnhancer.js",
        import.meta.url
    ),
    "utf8"
);
const unifiedController = await readFile(
    new URL(
        "../src/ui/UnifiedMobileTaskEditorController.js",
        import.meta.url
    ),
    "utf8"
);
const main = await readFile(
    new URL("../src/main.js", import.meta.url),
    "utf8"
);
const attachmentController = await readFile(
    new URL(
        "../src/ui/AttachmentController.js",
        import.meta.url
    ),
    "utf8"
);
const styles = await readFile(
    new URL(
        "../styles/task-editor-mobile-compact.css",
        import.meta.url
    ),
    "utf8"
);
const index = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8"
);
const pwaAssets = await readFile(
    new URL("../pwa-assets.js", import.meta.url),
    "utf8"
);

test("Área y Contexto permanecen visibles como organización primaria", () => {
    assert.match(
        enhancer,
        /mobileTaskEditorOrganizationHeading/
    );
    assert.match(
        enhancer,
        /contextLabel\.textContent = "@Contexto"/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorContextBar[\s\S]*grid-template-columns:\s*1fr/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorContextField[\s\S]*min-height:\s*54px/
    );
});

test("las propiedades secundarias se presentan como siete accesos compactos", () => {
    for (const label of [
        "Prioridad",
        "Vencimiento",
        "Etiquetas",
        "Programación",
        "Adjuntos",
        "Objetivo",
        "Subtareas"
    ]) {
        assert.match(
            enhancer,
            new RegExp(`label: "${label}"|>${label}<|${label}`)
        );
    }

    assert.match(
        styles,
        /mobileTaskEditorToolGrid[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/
    );
    assert.match(
        styles,
        /mobileTaskEditorCompactSummary[\s\S]*height:\s*82px/
    );
});

test("Subtareas se integra en la grilla y abre su panel transitorio", () => {
    assert.match(
        enhancer,
        /const subtasks = drawer\.querySelector\([\s\S]*"\.mobileTaskEditorSubtasks"/
    );
    assert.match(
        enhancer,
        /renderIcon\("subtasks"\)/
    );
    assert.match(
        enhancer,
        /configureTransient\([\s\S]*subtasks[\s\S]*"Subtareas"/
    );
    assert.match(
        enhancer,
        /goals,\s*subtasks/
    );
    assert.match(
        styles,
        /mobileTaskEditorCompactSubtasks[\s\S]*> summary/
    );
});

test("Subtareas comparte el acabado sin contorno de las herramientas móviles", async () => {
    const densityStyles = await readFile(
        new URL(
            "../styles/task-editor-mobile-density.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        densityStyles,
        /mobileTaskEditorCompactSubtasks[\s\S]*> summary[\s\S]*border:\s*0 !important;[\s\S]*background:\s*transparent !important;/
    );
    assert.match(
        densityStyles,
        /mobileTaskEditorSubtasks[\s\S]*> summary:hover[\s\S]*border:\s*0 !important;/
    );
});

test("Inicio y vencimiento pueden quitarse sin depender del selector nativo", () => {
    assert.match(
        enhancer,
        /addDateClearAction\(\s*startField,\s*"taskStartDate"/
    );
    assert.match(
        enhancer,
        /addDateClearAction\(\s*dueField,\s*"taskDueDate"/
    );
    assert.match(
        enhancer,
        /input\.dispatchEvent\(new Event\([\s\S]*"change"/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorDateClear[\s\S]*color:\s*var\(--color-danger\)/
    );
});

test("Adjuntos nace cerrado en móvil desde su controlador de origen", () => {
    assert.match(
        attachmentController,
        /const mobileEditor = window\.matchMedia\?\./
    );
    assert.match(
        attachmentController,
        /section\.open = draft && !mobileEditor/
    );
});

test("Más acciones usa una caja de scroll con altura real de viewport", () => {
    assert.match(
        styles,
        /mobileTaskEditorCompactOverflow[\s\S]*height:\s*calc\([\s\S]*100dvh - 66px - env\(safe-area-inset-bottom\)[\s\S]*\)/
    );
    assert.match(
        styles,
        /mobileTaskEditorCompactOverflow[\s\S]*max-height:\s*none/
    );
    assert.match(
        styles,
        /mobileTaskEditorCompactOverflow[\s\S]*overflow-y:\s*auto/
    );
});

test("Cancelar y Guardar forman parte del flujo normal del editor", () => {
    assert.match(
        enhancer,
        /\.mobileTaskEditorFooter[\s\S]*position:\s*static\s*!important/
    );
    assert.match(
        enhancer,
        /save\.textContent = "Guardar"/
    );
    assert.match(
        enhancer,
        /cancel\.textContent = "Cancelar"/
    );
});

test("las acciones administrativas pasan al menú y Guardar queda en el pie", () => {
    assert.match(
        enhancer,
        /mobileTaskEditorCompactOverflow/
    );
    assert.match(
        enhancer,
        /primary\?\.querySelector\("#toggleTask"\)/
    );
});

test("un único controlador gobierna las dos etapas del editor móvil", () => {
    assert.match(
        unifiedController,
        /extends MobileTaskEditorLayoutController/
    );
    assert.match(
        unifiedController,
        /super\.enhanceEditor\(\)/
    );
    assert.match(
        unifiedController,
        /enhanceCompactMobileTaskEditor\(drawer\)/
    );
    assert.match(
        main,
        /new UnifiedMobileTaskEditorController\(app\)/
    );
    assert.doesNotMatch(
        main,
        /new MobileTaskEditorLayoutController\(app\)/
    );
});

test("el compacto no instala observadores ni ciclos autónomos", () => {
    assert.doesNotMatch(
        enhancer,
        /new MutationObserver/
    );
    assert.doesNotMatch(
        enhancer,
        /window\.addEventListener\("resize"/
    );
    assert.doesNotMatch(
        enhancer,
        /queueMicrotask\(enhance/
    );
    assert.doesNotMatch(
        index,
        /MobileTaskEditorCompactLoader\.js/
    );
});

test("Mover se integra directamente en Opciones sin fallback destructivo", () => {
    assert.match(
        enhancer,
        /grid\?\.querySelector\([\s\S]*"\.mobileTaskEditorMoveTool"/
    );
    assert.match(
        enhancer,
        /if \(move\) optionFields\.append\(move\)/
    );
    assert.doesNotMatch(
        enhancer,
        /moveButton\.remove\(\)/
    );
});

test("Notas de Notion se ubica antes de las acciones administrativas", () => {
    assert.match(
        enhancer,
        /function appendNotionNotes/
    );
    assert.match(
        enhancer,
        /\.editorNotionSection/
    );
    assert.match(
        enhancer,
        /appendNotionNotes\(drawer, body\);[\s\S]*const administrative/
    );
    assert.doesNotMatch(
        enhancer,
        /notionSection\.open = false/
    );
});

test("la mejora queda aislada a móvil y disponible en la PWA", () => {
    assert.match(
        enhancer,
        /\(max-width: 760px\)/
    );
    assert.match(
        enhancer,
        /task-editor-mobile-compact\.css/
    );
    assert.match(
        pwaAssets,
        /MobileTaskEditorCompactEnhancer\.js/
    );
    assert.match(
        pwaAssets,
        /task-editor-mobile-compact\.css/
    );
});

test("la hoja compacta conserva llaves CSS balanceadas", () => {
    const withoutComments = styles.replace(
        /\/\*[\s\S]*?\*\//g,
        ""
    );
    const opening = withoutComments.match(/\{/g)?.length ?? 0;
    const closing = withoutComments.match(/\}/g)?.length ?? 0;

    assert.equal(opening, closing);
});
