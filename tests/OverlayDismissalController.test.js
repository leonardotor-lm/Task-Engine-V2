import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    OverlayDismissalController
} from "../src/ui/OverlayDismissalController.js";

const source = await readFile(
    new URL(
        "../src/ui/OverlayDismissalController.js",
        import.meta.url
    ),
    "utf8"
);
const main = await readFile(
    new URL("../src/main.js", import.meta.url),
    "utf8"
);

test("detecta clics fuera de un diálogo y sobre su fondo", () => {

    const controller =
        new OverlayDismissalController(null, {
            documentRef: null
        });

    const inside = {};
    const outside = {};
    const dialog = {
        contains(target) {
            return target === inside;
        },
        getBoundingClientRect() {
            return {
                left: 100,
                right: 400,
                top: 100,
                bottom: 300
            };
        }
    };

    assert.equal(
        controller.isOutsideDialog(
            dialog,
            { target: inside }
        ),
        false
    );
    assert.equal(
        controller.isOutsideDialog(
            dialog,
            { target: outside }
        ),
        true
    );
    assert.equal(
        controller.isOutsideDialog(
            dialog,
            {
                target: dialog,
                clientX: 50,
                clientY: 150
            }
        ),
        true
    );
    assert.equal(
        controller.isOutsideDialog(
            dialog,
            {
                target: dialog,
                clientX: 200,
                clientY: 150
            }
        ),
        false
    );

});

test("sólo considera cerrable el diálogo abierto superior", () => {

    const first = {};
    const second = {};
    const documentRef = {
        querySelectorAll() {
            return [first, second];
        }
    };
    const controller =
        new OverlayDismissalController(null, {
            documentRef
        });

    assert.equal(
        controller.isTopDialog(first),
        false
    );
    assert.equal(
        controller.isTopDialog(second),
        true
    );

});

test("integra cierre por Escape y clic exterior en los overlays pendientes", () => {

    assert.match(
        main,
        /OverlayDismissalController/
    );
    assert.match(
        main,
        /overlayDismissalController\.start\(\)/
    );

    for (const id of [
        "advancedSearchDialog",
        "settingsDialog",
        "calendarDayDialog"
    ]) {
        assert.match(source, new RegExp(id));
    }

    assert.match(source, /\.goalDrawer/);
    assert.match(source, /event\.key !== "Escape"/);
    assert.match(source, /"pointerdown"/);
    assert.match(source, /isTopDialog/);
    assert.match(source, /hasOpenDialog/);
    assert.match(source, /onCloseAdvancedSearch/);
    assert.match(source, /onCloseSettings/);
    assert.match(source, /onCloseCalendarDay/);
    assert.match(source, /onCloseGoalEditor/);

});

test("Escape restaura el foco al disparador después del rerender", () => {

    assert.match(
        source,
        /close\(true\)/
    );
    assert.match(
        source,
        /this\.restoreFocus\(opener\)/
    );
    assert.match(
        source,
        /this\.queueMicrotask\(\(\) =>/
    );
    assert.match(
        source,
        /toggleAdvancedSearch/
    );
    assert.match(source, /openSettings/);
    assert.match(source, /editGoal/);

});
