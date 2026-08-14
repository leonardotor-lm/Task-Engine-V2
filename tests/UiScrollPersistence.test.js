import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { MainView } from "../src/ui/MainView.js";

const appSource = await readFile(
    new URL("../src/core/App.js", import.meta.url),
    "utf8"
);
const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("conserva el desplazamiento independiente de cada superficie", () => {
    const restoredClasses = new Set();
    const elements = new Map([
        ["#appSidebar", { scrollTop: 420, scrollLeft: 0 }],
        [".content", { scrollTop: 180, scrollLeft: 3 }],
        [".taskDrawer", {
            scrollTop: 760,
            scrollLeft: 0,
            classList: {
                add: className =>
                    restoredClasses.add(className)
            }
        }],
        ["#settingsDialog", { scrollTop: 95, scrollLeft: 0 }]
    ]);
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    let restoredWindowPosition = null;

    globalThis.document = {
        querySelector: selector =>
            elements.get(selector) ?? null
    };
    globalThis.window = {
        scrollX: 7,
        scrollY: 24,
        scrollTo: position => {
            restoredWindowPosition = position;
        }
    };

    try {
        const view = Object.create(MainView.prototype);
        const state = view.captureScrollState();

        for (const element of elements.values()) {
            element.scrollTop = 0;
            element.scrollLeft = 0;
        }

        view.restoreScrollState(state);

        assert.equal(
            elements.get("#appSidebar").scrollTop,
            420
        );
        assert.equal(
            elements.get(".content").scrollTop,
            180
        );
        assert.equal(
            elements.get(".taskDrawer").scrollTop,
            760
        );
        assert.equal(
            restoredClasses.has("taskDrawerRestored"),
            true
        );
        assert.equal(
            elements.get("#settingsDialog").scrollTop,
            95
        );
        assert.deepEqual(restoredWindowPosition, {
            top: 24,
            left: 7,
            behavior: "auto"
        });
    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }
});

test("restaura la barra lateral después de los ajustes posteriores al render", async () => {
    const sidebar = {
        scrollTop: 510,
        scrollLeft: 0
    };
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;

    globalThis.document = {
        querySelector: selector =>
            selector === "#appSidebar"
                ? sidebar
                : null
    };
    globalThis.window = {
        scrollX: 0,
        scrollY: 0,
        scrollTo() {}
    };

    try {
        const view = Object.create(
            MainView.prototype
        );
        const state = view.captureScrollState();

        view.scheduleFinalScrollRestore(state);

        sidebar.scrollTop = 0;

        await new Promise(resolve =>
            queueMicrotask(resolve)
        );

        assert.equal(sidebar.scrollTop, 510);
    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }
});

test("restaura el desplazamiento después de los ajustes tardíos de Android", async () => {
    const sidebar = {
        scrollTop: 510,
        scrollLeft: 0
    };
    const frameCallbacks = [];
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;

    globalThis.document = {
        querySelector: selector =>
            selector === "#appSidebar"
                ? sidebar
                : null
    };
    globalThis.window = {
        scrollX: 0,
        scrollY: 0,
        scrollTo() {},
        requestAnimationFrame(callback) {
            frameCallbacks.push(callback);
        }
    };

    try {
        const view = Object.create(
            MainView.prototype
        );
        const state = view.captureScrollState();

        view.scheduleFinalScrollRestore(state);
        sidebar.scrollTop = 0;

        await new Promise(resolve =>
            queueMicrotask(resolve)
        );

        assert.equal(sidebar.scrollTop, 510);

        sidebar.scrollTop = 0;
        frameCallbacks.shift()();
        assert.equal(sidebar.scrollTop, 510);

        sidebar.scrollTop = 0;
        frameCallbacks.shift()();
        assert.equal(sidebar.scrollTop, 510);
    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }
});

test("conserva abierta la barra lateral móvil durante el render", () => {
    const addedClasses = new Set();
    const attributes = new Map();
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    let layout = {
        classList: {
            contains: className =>
                className === "mobileMenuOpen"
        }
    };

    globalThis.document = {
        querySelector(selector) {
            if (selector === ".layout") {
                return layout;
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
        scrollX: 0,
        scrollY: 0
    };

    try {
        const view = Object.create(
            MainView.prototype
        );
        const state = view.captureScrollState();

        layout = {
            classList: {
                add: className =>
                    addedClasses.add(className)
            }
        };

        view.restoreMobileMenuState(state);

        assert.equal(
            addedClasses.has("mobileMenuOpen"),
            true
        );
        assert.equal(
            attributes.get("aria-expanded"),
            "true"
        );
    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }
});

test("la sincronización protege ediciones transitorias", () => {
    const renderStart = appSource.indexOf(
        "render({ preserveTransientUi = false } = {})"
    );
    const renderBlock = appSource.slice(
        renderStart,
        renderStart + 700
    );

    assert.match(
        renderBlock,
        /preserveTransientUi[\s\S]*?hasUnsavedTaskEdit/
    );
    assert.match(
        renderBlock,
        /hasActiveEntityEdit/
    );
    assert.match(
        renderBlock,
        /hasActiveEntityCreation/
    );

    for (const method of [
        "async runManualSync(",
        "async runAutomaticPush(",
        "async checkRemoteStatus()"
    ]) {
        const start = appSource.indexOf(method);
        const nextMethod = appSource.indexOf(
            "\n    }",
            start
        );
        const block = appSource.slice(start, nextMethod);

        assert.match(
            block,
            /render\(\{ preserveTransientUi: true \}\)/
        );
    }
});

test("un editor restaurado no repite su animación de entrada", () => {
    assert.match(
        styles,
        /\.taskDrawer\.taskDrawerRestored\s*\{[\s\S]*?animation:\s*none;/
    );
});
