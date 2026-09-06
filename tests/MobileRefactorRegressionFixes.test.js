import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const unifiedMobileEditor = await readFile(
    new URL(
        "../src/ui/UnifiedMobileTaskEditorController.js",
        import.meta.url
    ),
    "utf8"
);

const attachmentController = await readFile(
    new URL(
        "../src/ui/AttachmentController.js",
        import.meta.url
    ),
    "utf8"
);

const deviceFixes = await readFile(
    new URL(
        "../styles/task-editor-mobile-device-fixes.css",
        import.meta.url
    ),
    "utf8"
);

const mobileDensity = await readFile(
    new URL(
        "../styles/mobile-density.css",
        import.meta.url
    ),
    "utf8"
);

const compactEnhancer = await readFile(
    new URL(
        "../src/ui/MobileTaskEditorCompactEnhancer.js",
        import.meta.url
    ),
    "utf8"
);

const taskInterface = await readFile(
    new URL(
        "../styles/task-interface.css",
        import.meta.url
    ),
    "utf8"
);

const mobileLayoutController = await readFile(
    new URL(
        "../src/ui/MobileTaskEditorLayoutController.js",
        import.meta.url
    ),
    "utf8"
);

test("las tareas con adjuntos recuperan un indicador visible en metadatos", () => {
    assert.match(
        attachmentController,
        /renderTaskIndicators\(\)/
    );
    assert.match(
        attachmentController,
        /taskAttachmentIndicator/
    );
    assert.match(
        attachmentController,
        /taskAttachmentIcon/
    );
    assert.match(
        attachmentController,
        /metadata\.prepend\(indicator\)/
    );
    assert.match(
        attachmentController,
        /titleLine\.after\(metadata\)/
    );
    assert.doesNotMatch(
        attachmentController,
        /title\.prepend\(indicator\)/
    );
});

test("Notas se reconcilia como herramienta visible del editor móvil", () => {
    assert.match(
        unifiedMobileEditor,
        /promoteNotionNotes\(drawer\)/
    );
    assert.match(
        unifiedMobileEditor,
        /mobileTaskEditorNotesTool/
    );
    assert.match(
        unifiedMobileEditor,
        /grid\.append\(notes\)/
    );
    assert.match(
        unifiedMobileEditor,
        /placeOverflowLast\(grid\)/
    );
    assert.match(
        unifiedMobileEditor,
        /if \(overflow\) grid\.append\(overflow\)/
    );
    assert.match(
        unifiedMobileEditor,
        /MutationObserver/
    );
});

test("Notas ajusta su panel al contenido y mantiene visible la acción", () => {
    assert.match(
        deviceFixes,
        /mobileTaskEditorNotesTool\[open\][\s\S]*display:\s*grid\s*!important/
    );
    assert.match(
        deviceFixes,
        /mobileTaskEditorNotesTool\[open\][\s\S]*width:\s*auto\s*!important/
    );
    assert.match(
        deviceFixes,
        /mobileTaskEditorNotesTool\[open\][\s\S]*height:\s*auto\s*!important/
    );
    assert.match(
        deviceFixes,
        /> \.secondaryAction,[\s\S]*visibility:\s*visible\s*!important/
    );
});

test("el pie móvil no captura las acciones Abrir y Desvincular de Notas", () => {
    assert.match(
        mobileLayoutController,
        /querySelector\([\s\S]*"#saveTask"[\s\S]*\)\?\.closest\("\.taskEditorActions"\)/
    );
    assert.doesNotMatch(
        mobileLayoutController,
        /const actions = drawer\.querySelector\(\s*"\.taskEditorActions"/
    );
});

test("los selectores asíncronos recuperan icono y descartan texto desbordado", () => {
    assert.match(
        unifiedMobileEditor,
        /reconcileCompactPickers\(drawer\)/
    );
    assert.match(
        unifiedMobileEditor,
        /\["taskTags", "Etiquetas", "tags"\]/
    );
    assert.match(
        unifiedMobileEditor,
        /\["taskGoals", "Objetivo", "goals"\]/
    );
    assert.match(
        unifiedMobileEditor,
        /summary\.replaceChildren\(\)/
    );
});

test("Mover conserva abierto el panel padre de Más acciones", () => {
    assert.match(
        compactEnhancer,
        /!panel\.contains\(current\)/
    );
});

test("la hoja de acciones oculta controles que podrían atravesarla", () => {
    assert.match(
        taskInterface,
        /body:has\(\.quickMoreActions\[open\]\)[\s\S]*\.quickMoreActions:not\(\[open\]\) > summary/
    );
    assert.match(
        taskInterface,
        /body:has\(\.quickMoreActions\[open\]\)[\s\S]*#openTaskCreation/
    );
});

test("Programación conserva un control de icono sin etiqueta visible", () => {
    assert.match(
        unifiedMobileEditor,
        /mobileTaskEditorProgrammingSummary/
    );
    assert.match(
        unifiedMobileEditor,
        /aria-label[\s\S]*Programación/
    );
    assert.match(
        unifiedMobileEditor,
        /visibleLabel\?\.remove\(\)/
    );
});

test("las X de los paneles compactos cierran su details de forma explícita", () => {
    assert.match(
        unifiedMobileEditor,
        /compactCloseBound/
    );
    assert.match(
        unifiedMobileEditor,
        /details\.open = false/
    );
    assert.match(
        unifiedMobileEditor,
        /body\.hidden = true/
    );
});

test("la rotación horizontal limita los iconos compactos", () => {
    assert.match(
        deviceFixes,
        /orientation:\s*landscape/
    );
    assert.match(
        deviceFixes,
        /max-height:\s*760px/
    );
    assert.match(
        deviceFixes,
        /mobileTaskEditorCompactIcon[\s\S]*width:\s*22px\s*!important/
    );
});

test("la lista móvil reduce margen lateral y separación vertical sin alterar el editor", () => {
    assert.match(
        mobileDensity,
        /\.content[\s\S]*padding:\s*6px 6px 10px/
    );
    assert.match(
        mobileDensity,
        /\.task\s*\{[\s\S]*padding:\s*6px 6px/
    );
    assert.doesNotMatch(
        deviceFixes,
        /mobileTaskEditorCompactLayout[\s\S]*padding-left:\s*10px\s*!important/
    );
});
