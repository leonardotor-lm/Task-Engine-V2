import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";


test("la aplicación carga la distribución específica del editor móvil", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const controller = await readFile(
        new URL(
            "../src/ui/MobileTaskEditorLayoutController.js",
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
    const styles = await readFile(
        new URL(
            "../styles/task-editor-mobile.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        main,
        /UnifiedMobileTaskEditorController/
    );
    assert.match(
        main,
        /mobileTaskEditorController\.start\(\)/
    );
    assert.match(
        unifiedController,
        /extends MobileTaskEditorLayoutController/
    );
    assert.match(
        unifiedController,
        /enhanceCompactMobileTaskEditor/
    );
    assert.match(
        unifiedController,
        /task-editor-mobile-compact\.css/
    );
    assert.match(
        unifiedController,
        /preloadCompactStylesheets\(\)/
    );
    assert.match(
        unifiedController,
        /unavailableMove\?\.disabled/
    );
    assert.match(
        unifiedController,
        /textContent\?\.trim\(\) === "Mover"/
    );
    assert.match(
        unifiedController,
        /unavailableMove\.remove\(\)/
    );
    assert.match(
        controller,
        /\(max-width: 760px\)/
    );
    assert.match(
        controller,
        /mobileTaskEditorContextBar/
    );
    assert.match(
        controller,
        /mobileTaskEditorMainFields/
    );
    assert.match(
        controller,
        /mobileTaskEditorProperties/
    );
    assert.match(
        controller,
        /mobileTaskEditorProjectProperty/
    );
    assert.match(
        controller,
        /["']taskStartDate["'], ["']Inicio["']/
    );
    assert.match(
        controller,
        /mobileTaskEditorToolGrid/
    );
    assert.match(
        controller,
        /"Etiquetas"/
    );
    assert.match(
        controller,
        /"Objetivos"/
    );
    assert.match(
        controller,
        /"Recurrencia"/
    );
    assert.match(
        controller,
        /"Mover"/
    );
    assert.match(
        controller,
        /mobileTaskEditorPanelClose/
    );
    assert.match(
        controller,
        /event\.key !== "Escape"/
    );
    assert.match(
        controller,
        /mobileSaveButton\.hidden = true/
    );
    assert.match(
        controller,
        /"saveTask"/
    );
    assert.match(
        styles,
        /^@media \(max-width: 760px\)/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorTitleField/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorToolGrid/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorPanel/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorFooter/
    );
    assert.match(
        styles,
        /env\(safe-area-inset-bottom\)/
    );

});
