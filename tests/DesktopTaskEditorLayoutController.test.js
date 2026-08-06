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
        /configurePicker/
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
        /"Más herramientas"/
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
        /desktopTaskEditorMoveTool/
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
        styles,
        /^@media \(min-width: 761px\)/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorTitleField/
    );
    assert.match(
        styles,
        /height: 38px;/
    );
    assert.match(
        styles,
        /resize: vertical;/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorMoreTools/
    );
    assert.match(
        styles,
        /\.desktopTaskEditorFooter/
    );

});
