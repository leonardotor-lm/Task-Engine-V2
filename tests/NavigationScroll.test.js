import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);

test("la navegación principal vuelve al inicio del contenido", () => {
    assert.match(
        source,
        /navigateAndResetScroll\(callback\)[\s\S]*?content\.scrollTop = 0[\s\S]*?window\.scrollTo\(\{[\s\S]*?top: 0/
    );

    const navigationBlock = source.match(
        /const navigationActions = \[[\s\S]*?for \([\s\S]*?\n        \}/
    )?.[0] ?? "";

    for (const elementId of [
        "showInbox",
        "showToday",
        "showTomorrow",
        "showUpcoming",
        "showAll",
        "showCompleted",
        "showArchived",
        "showTrash",
        "showGoals",
        "manageAreas",
        "manageContexts",
        "manageTags"
    ]) {
        assert.match(
            navigationBlock,
            new RegExp(`"${elementId}"`)
        );
    }

    assert.match(
        navigationBlock,
        /this\.navigateAndResetScroll/
    );
});

test("áreas y filtros guardados también reinician el desplazamiento", () => {
    assert.match(
        source,
        /\.showAreaView[\s\S]*?this\.navigateAndResetScroll\([\s\S]*?\.onShowArea/
    );
    assert.match(
        source,
        /\.showCustomFilter[\s\S]*?this\.navigateAndResetScroll\([\s\S]*?\.onApplyCustomFilter/
    );
});

test("la selección múltiple conserva su desplazamiento por separado", () => {
    assert.match(
        source,
        /preserveContentScroll\(callback\)[\s\S]*?renderedContent\.scrollTop/
    );
});
