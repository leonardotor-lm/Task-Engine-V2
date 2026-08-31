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

test("las tareas con adjuntos recuperan un indicador visible", () => {
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

test("la rotación horizontal limita iconos y el editor usa menos margen lateral", () => {
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
    assert.match(
        deviceFixes,
        /mobileTaskEditorCompactLayout[\s\S]*padding-left:\s*10px\s*!important/
    );
});
