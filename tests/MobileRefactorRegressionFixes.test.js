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
        /MutationObserver/
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

test("la lista móvil reduce su margen lateral sin alterar el editor", () => {
    assert.match(
        mobileDensity,
        /\.content[\s\S]*padding:\s*6px 6px 10px/
    );
    assert.match(
        mobileDensity,
        /\.task\s*\{[\s\S]*padding:\s*10px 6px/
    );
    assert.doesNotMatch(
        deviceFixes,
        /mobileTaskEditorCompactLayout[\s\S]*padding-left:\s*10px\s*!important/
    );
});
