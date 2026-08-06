import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";


test("la aplicación carga la adaptación principal para celular", async () => {

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
            "../src/ui/MobileMainLayoutController.js",
            import.meta.url
        ),
        "utf8"
    );
    const styles = await readFile(
        new URL(
            "../styles/task-interface.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        main,
        /MobileMainLayoutController/
    );
    assert.match(
        main,
        /mobileMainLayoutController\.start\(\)/
    );
    assert.match(
        index,
        /styles\/task-interface\.css/
    );
    assert.match(
        controller,
        /mobileFloatingTaskButton/
    );
    assert.match(
        controller,
        /layout\.append\(button\)/
    );
    assert.match(
        styles,
        /\.mobileHeader strong/
    );
    assert.match(
        styles,
        /\.taskListHeading h2/
    );
    assert.match(
        styles,
        /\.mobileFloatingTaskButton/
    );
    assert.match(
        styles,
        /taskContextToolbarSummary/
    );

});
