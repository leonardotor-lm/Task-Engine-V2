import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";


test("la aplicación carga la estructura específica del editor de escritorio", async () => {

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
        /taskTags/
    );
    assert.match(
        controller,
        /field\.append\(label, control\)/
    );
    assert.match(
        controller,
        /desktopTaskEditorPrimaryActions/
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
        /\.desktopTaskEditorAdministrativeActions/
    );

});
