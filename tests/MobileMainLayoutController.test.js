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
        /const goalsView = state\.view === "goals";/
    );
    assert.match(
        controller,
        /const projectView = state\.view === "project";/
    );
    assert.match(
        controller,
        /getElementById\(\s*"openProjectTaskCreation"\s*\)/
    );
    assert.match(
        controller,
        /taskButton\.hidden = Boolean\([\s\S]*?goalsView[\s\S]*?projectView/
    );
    assert.match(
        controller,
        /if \(projectView && projectTaskButton\)[\s\S]*?mobileFloatingTaskButton[\s\S]*?layout\.append\(projectTaskButton\)/
    );
    assert.match(
        controller,
        /if \(goalsView && goalButton\)[\s\S]*?layout\.append\(goalButton\)/
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