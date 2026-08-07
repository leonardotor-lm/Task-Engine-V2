import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";


test("la aplicación carga la estructura minimalista del editor de escritorio", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const index = await readFile(
        new URL("../index.html", import.meta.url),
        "utf8"
    );
    const controller = await readFile(
        new URL(
            "../src/ui/DesktopTaskEditorLayoutController.js",
            import.meta.url
        ),
        "utf8"
    );
    const styles = await readFile(
        new URL(
            "../styles/task-editor-desktop.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        main,
        /DesktopTaskEditorLayoutController/
    );
    assert.match(
        main,
        /desktopTaskEditorLayoutController\.start\(\)/
    );
    assert.match(
        index,
        /styles\/task-editor-desktop\.css/
    );
    assert.match(
        controller,
        /\(min-width: 761px\)/
    );
    assert.match(
        controller,
        /if \(\s*!window\.matchMedia/
    );
    assert.match(
        controller,
        /desktopTaskEditorContextBar/
    );
    assert.match(
        controller,
        /desktopTaskEditorMainFields/
    );
    assert.match(
        controller,
        /desktopTaskEditorProperties/
    );
    assert.match(
        controller,
        /desktopTaskEditorToolRow/
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
        /summary\.textContent = "Mover"/
    );
    assert.doesNotMatch(
        controller,
        /"Más herramientas"/
    );
    assert.doesNotMatch(
        controller,
        /"Acciones"/
    );
    assert.doesNotMatch(
        controller,
        /"Planificación"/
    );
    assert.match(
        controller,
        /hourLabel\.textContent = "Hora"/
    );
    assert.match(
        controller,
        /waitingTaskHint/
    );
    assert.match(
        controller,
        /primarySection\.querySelectorAll\([\s\S]*:scope > summary/
    );
    assert.match(
        controller,
        /primarySection\.replaceWith\(primarySurface\)/
    );
    assert.match(
        controller,
        /decoratePopover/
    );
    assert.match(
        controller,
        /desktopTaskEditorPopoverClose/
    );
    assert.match(
        controller,
        /bindTransientPanels/
    );
    assert.match(
        controller,
        /event\.key !== "Escape"/
    );
    assert.match(
        controller,
        /!panel\.contains\(event\.target\)/
    );
    assert.match(
        controller,
        /desktopTaskEditorTagText/
    );
    assert.match(
        controller,
        /desktopTaskEditorAdministrativeActions/
    );
    assert.match(
        controller,
        /"archiveTask"/
    );
    assert.match(
        controller,
        /"deleteTask"/
    );
    assert.match(
        controller,
        /unavailableMove\.textContent = "Mover"/
    );

    assert.match(
        styles,
        /^@media \(min-width: 761px\)/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorToolRow\s*\{/
    );
    assert.match(
        styles,
        /repeat\(4, minmax\(0, 1fr\)\)/
    );
    assert.match(
        styles,
        /font-size: 14px;/
    );
    assert.match(
        styles,
        /resize: vertical;/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorPopover\s*\{/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorTagText/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorAdministrativeActions/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorFooter/
    );

});
