import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    TaskToolbarLayoutController
} from "../src/ui/TaskToolbarLayoutController.js";

function createStorage() {

    const values = new Map();

    return {
        getItem(key) {
            return values.has(key)
                ? values.get(key)
                : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };

}

test("los grupos laterales conservan sus estados iniciales", () => {

    const controller =
        new TaskToolbarLayoutController(
            null,
            { storage: createStorage() }
        );

    assert.equal(
        controller.readAreasExpanded(),
        true
    );
    assert.equal(
        controller.readPlanningExpanded(),
        true
    );
    assert.equal(
        controller.readHistoryExpanded(false),
        false
    );
    assert.equal(
        controller.readHistoryExpanded(true),
        true
    );

});

test("recuerda de forma independiente el estado de cada grupo", () => {

    const storage = createStorage();
    const controller =
        new TaskToolbarLayoutController(
            null,
            { storage }
        );

    controller.writeAreasExpanded(false);
    controller.writePlanningExpanded(false);
    controller.writeHistoryExpanded(true);

    const restored =
        new TaskToolbarLayoutController(
            null,
            { storage }
        );

    assert.equal(
        restored.readAreasExpanded(),
        false
    );
    assert.equal(
        restored.readPlanningExpanded(),
        false
    );
    assert.equal(
        restored.readHistoryExpanded(false),
        true
    );

});

test("la aplicación carga el refinamiento de barra y grupos laterales", async () => {

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
            "../src/ui/TaskToolbarLayoutController.js",
            import.meta.url
        ),
        "utf8"
    );
    const sidebarController = await readFile(
        new URL(
            "../src/ui/SidebarLayoutController.js",
            import.meta.url
        ),
        "utf8"
    );
    const styles = await readFile(
        new URL(
            "../task-toolbar-layout.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        main,
        /SidebarLayoutController/
    );
    assert.match(
        main,
        /sidebarLayoutController\.start\(\)/
    );
    assert.match(
        index,
        /task-toolbar-layout\.css/
    );
    assert.match(
        styles,
        /taskContextToolbarIconButton/
    );
    assert.match(
        styles,
        /sidebarUnifiedGroup/
    );
    assert.match(
        styles,
        /::-webkit-details-marker/
    );
    assert.match(
        styles,
        /sidebarAreaGroup\.sidebarUnifiedGroup/
    );
    assert.match(
        controller,
        /ensurePlanningGroup/
    );
    assert.match(
        controller,
        /sidebarHistoryGroup/
    );
    assert.match(
        sidebarController,
        /"showAll",\s*"showWaiting",\s*"showCalendar",\s*"showGoals"/
    );

});
