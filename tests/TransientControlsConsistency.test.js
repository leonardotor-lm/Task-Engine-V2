import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);
const desktopStyles = await readFile(
    new URL(
        "../styles/task-editor-desktop.css",
        import.meta.url
    ),
    "utf8"
);
const mobileStyles = await readFile(
    new URL(
        "../styles/task-editor-mobile.css",
        import.meta.url
    ),
    "utf8"
);
const overlaySource = await readFile(
    new URL(
        "../src/ui/OverlayDismissalController.js",
        import.meta.url
    ),
    "utf8"
);
const taskFiltersSource = await readFile(
    new URL(
        "../src/ui/TaskFiltersDialogController.js",
        import.meta.url
    ),
    "utf8"
);
const multiSelectSource = await readFile(
    new URL(
        "../src/ui/SearchableMultiSelect.js",
        import.meta.url
    ),
    "utf8"
);
const colorSelectorSource = await readFile(
    new URL(
        "../src/ui/ColorSelector.js",
        import.meta.url
    ),
    "utf8"
);

test("las superficies transitorias comparten geometría y elevación", () => {
    for (const token of [
        "--transient-surface-border",
        "--transient-surface-radius",
        "--transient-surface-shadow",
        "--transient-dialog-shadow",
        "--transient-backdrop"
    ]) {
        assert.match(styles, new RegExp(token));
    }

    for (const selector of [
        "colorSelectorContent",
        "quickPostponeMenu",
        "quickMoreMenu",
        "settingsDialog",
        "advancedSearchDialog",
        "taskToolsDialog",
        "calendarDayDialog",
        "appDialog"
    ]) {
        assert.match(
            styles,
            new RegExp(
                `\\.${selector}\\s*\\{[\\s\\S]*?` +
                "var\\(--transient-"
            )
        );
    }

    assert.match(
        desktopStyles,
        /\.desktopTaskEditorPopover[\s\S]*?var\(--transient-surface-shadow\)/
    );
    assert.match(
        mobileStyles,
        /\.mobileTaskEditorPanel[\s\S]*?var\(--transient-dialog-shadow\)/
    );
});

test("cada familia conserva cierre por Escape y clic exterior", () => {
    for (const id of [
        "advancedSearchDialog",
        "settingsDialog",
        "calendarDayDialog"
    ]) {
        assert.match(overlaySource, new RegExp(id));
    }
    assert.match(overlaySource, /"keydown"/);
    assert.match(overlaySource, /"pointerdown"/);

    assert.match(taskFiltersSource, /event\.key !== "Escape"/);
    assert.match(taskFiltersSource, /"pointerdown"/);

    assert.match(multiSelectSource, /event\.key !== "Escape"/);
    assert.match(colorSelectorSource, /dismissWithEscape/);
    assert.match(colorSelectorSource, /dismissFromOutside/);
});
