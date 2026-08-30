import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const controller = await readFile(
    new URL(
        "../src/ui/UnifiedMobileTaskEditorController.js",
        import.meta.url
    ),
    "utf8"
);

test("Notas conserva un acceso propio en la grilla móvil", () => {
    assert.match(
        controller,
        /\.editorNotionSection/
    );
    assert.match(
        controller,
        /\.mobileTaskEditorToolGrid/
    );
    assert.match(
        controller,
        /mobileTaskEditorNotesTool/
    );
    assert.match(
        controller,
        /mobileTaskEditorCompactSummary/
    );
    assert.match(
        controller,
        />\s*Notas\s*</
    );
    assert.match(
        controller,
        /grid\.append\(notes\)/
    );
});

test("Notas usa el mismo panel transitorio que el resto del editor", () => {
    assert.match(
        controller,
        /mobileTaskEditorCompactTransient/
    );
    assert.match(
        controller,
        /mobileTaskEditorCompactPanel/
    );
    assert.match(
        controller,
        /mobileTaskEditorCompactPanelHeader/
    );
    assert.match(
        controller,
        /Cerrar notas/
    );
    assert.match(
        controller,
        /panel !== notes/
    );
});

test("al promover Notas se elimina su copia visual en Más acciones", () => {
    assert.match(
        controller,
        /mobileTaskEditorCompactOverflowNotesContainer/
    );
    assert.match(
        controller,
        /classList\.remove\([\s\S]*mobileTaskEditorCompactOverflowNotes/
    );
    assert.match(
        controller,
        /previousContainer\?\.remove\(\)/
    );
    assert.match(
        controller,
        /previousTitle\.remove\(\)/
    );
});
