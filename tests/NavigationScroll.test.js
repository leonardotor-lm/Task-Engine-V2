import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { MainView } from "../src/ui/MainView.js";

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
        /this\.navigateFromSidebar/
    );
});

test("áreas y filtros guardados también reinician el desplazamiento", () => {
    assert.match(
        source,
        /\.showAreaView[\s\S]*?this\.navigateFromSidebar\([\s\S]*?\.onShowArea/
    );
    assert.match(
        source,
        /\.showCustomFilter[\s\S]*?this\.navigateFromSidebar\([\s\S]*?\.onApplyCustomFilter/
    );
});

test("la navegación móvil cierra la barra antes de renderizar la vista", () => {

    const classes = new Set([
        "mobileMenuOpen"
    ]);
    const attributes = new Map();
    const content = {
        scrollTop: 240
    };
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    let menuWasOpenDuringNavigation = null;
    let windowScroll = null;

    globalThis.document = {
        querySelector(selector) {

            if (selector === ".layout") {
                return {
                    classList: {
                        remove: className =>
                            classes.delete(className)
                    }
                };
            }

            if (selector === ".content") {
                return content;
            }

            return null;

        },
        getElementById(id) {

            return id === "toggleMobileMenu"
                ? {
                    setAttribute(name, value) {
                        attributes.set(name, value);
                    }
                }
                : null;

        }
    };
    globalThis.window = {
        scrollTo(position) {
            windowScroll = position;
        }
    };

    try {

        const view = Object.create(
            MainView.prototype
        );

        view.navigateFromSidebar(() => {
            menuWasOpenDuringNavigation =
                classes.has("mobileMenuOpen");
        });

        assert.equal(
            menuWasOpenDuringNavigation,
            false
        );
        assert.equal(
            attributes.get("aria-expanded"),
            "false"
        );
        assert.equal(content.scrollTop, 0);
        assert.deepEqual(windowScroll, {
            top: 0,
            left: 0,
            behavior: "auto"
        });

    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }

});

test("la selección múltiple conserva su desplazamiento por separado", () => {
    assert.match(
        source,
        /preserveContentScroll\(callback\)[\s\S]*?renderedContent\.scrollTop/
    );
});
