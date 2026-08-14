import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { MainView } from "../src/ui/MainView.js";

const mainViewSource = await readFile(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);
const appSource = await readFile(
    new URL("../src/core/App.js", import.meta.url),
    "utf8"
);

test("conserva foco, texto y cursor de una búsqueda durante el render", () => {
    const originalDocument = globalThis.document;
    const originalEvent = globalThis.Event;
    let focusOptions = null;
    let restoredSelection = null;
    let inputEvents = 0;

    const originalControl = {
        id: "advancedSearchInput",
        tagName: "INPUT",
        type: "search",
        value: "estado:pendiente",
        checked: false,
        selectionStart: 7,
        selectionEnd: 16,
        selectionDirection: "forward",
        closest: () => null
    };
    const renderedControl = {
        id: "advancedSearchInput",
        value: "",
        checked: false,
        disabled: false,
        focus: options => {
            focusOptions = options;
        },
        setSelectionRange: (...selection) => {
            restoredSelection = selection;
        },
        dispatchEvent: () => {
            inputEvents += 1;
        }
    };
    const appRoot = {
        contains: element =>
            element === originalControl
    };

    globalThis.Event = class {
        constructor(type, options) {
            this.type = type;
            this.options = options;
        }
    };
    globalThis.document = {
        activeElement: originalControl,
        getElementById: id => {
            if (id === "app") return appRoot;
            if (id === "advancedSearchInput") {
                return renderedControl;
            }
            return null;
        },
        querySelectorAll: () => []
    };

    try {
        const view = Object.create(
            MainView.prototype
        );
        const state =
            view.captureActiveControlState();

        view.restoreActiveControlState(state);

        assert.equal(
            renderedControl.value,
            "estado:pendiente"
        );
        assert.deepEqual(focusOptions, {
            preventScroll: true
        });
        assert.deepEqual(restoredSelection, [
            7,
            16,
            "forward"
        ]);
        assert.equal(inputEvents, 1);
    } finally {
        globalThis.document = originalDocument;
        globalThis.Event = originalEvent;
    }
});

test("no intenta restaurar un control que ya no existe", () => {
    const originalDocument = globalThis.document;

    globalThis.document = {
        getElementById: () => null,
        querySelectorAll: () => []
    };

    try {
        const view = Object.create(
            MainView.prototype
        );

        assert.doesNotThrow(() =>
            view.restoreActiveControlState({
                locator: {
                    kind: "id",
                    id: "removedControl"
                },
                openAncestor: null
            })
        );
    } finally {
        globalThis.document = originalDocument;
    }
});

test("restaura un campo repetido mediante el identificador de su contenedor", () => {
    const originalDocument = globalThis.document;
    const originalEvent = globalThis.Event;
    let focused = false;

    const originalControl = {
        id: "",
        tagName: "INPUT",
        type: "text",
        className: "inlineSubtaskTitle",
        value: "Subtarea todavía sin guardar",
        checked: false,
        selectionStart: 9,
        selectionEnd: 9,
        selectionDirection: "none"
    };
    const originalAnchor = {
        tagName: "FORM",
        dataset: {
            parentId: "task-parent"
        },
        querySelectorAll: () => [
            originalControl
        ]
    };
    originalControl.closest = selector =>
        selector === "details[open]"
            ? null
            : originalAnchor;

    const renderedControl = {
        id: "",
        tagName: "INPUT",
        type: "text",
        className: "inlineSubtaskTitle",
        value: "",
        checked: false,
        disabled: false,
        focus: () => {
            focused = true;
        },
        setSelectionRange() {},
        dispatchEvent() {}
    };
    const renderedAnchor = {
        dataset: {
            parentId: "task-parent"
        },
        querySelectorAll: () => [
            renderedControl
        ]
    };
    const appRoot = {
        contains: element =>
            element === originalControl
    };

    globalThis.Event = class {};
    globalThis.document = {
        activeElement: originalControl,
        getElementById: id =>
            id === "app" ? appRoot : null,
        querySelectorAll: selector =>
            selector === "form[data-parent-id]"
                ? [renderedAnchor]
                : []
    };

    try {
        const view = Object.create(
            MainView.prototype
        );
        const state =
            view.captureActiveControlState();

        view.restoreActiveControlState(state);

        assert.equal(
            renderedControl.value,
            "Subtarea todavía sin guardar"
        );
        assert.equal(focused, true);
    } finally {
        globalThis.document = originalDocument;
        globalThis.Event = originalEvent;
    }
});

test("el render captura la interacción antes de reemplazar la interfaz", () => {
    const captureIndex = mainViewSource.indexOf(
        "this.captureActiveControlState()"
    );
    const replaceIndex = mainViewSource.indexOf(
        'document.getElementById("app").innerHTML'
    );
    const restoreIndex = mainViewSource.indexOf(
        "this.restoreActiveControlState("
    );

    assert.ok(captureIndex >= 0);
    assert.ok(replaceIndex > captureIndex);
    assert.ok(restoreIndex > replaceIndex);
});

test("detecta cambios sin guardar en el editor de objetivos", () => {
    const originalDocument = globalThis.document;
    const elements = new Map([
        ["goalEditorForm", {}],
        ["goalTitleEdit", {
            value: "Objetivo modificado"
        }],
        ["goalDescriptionEdit", {
            value: "Descripción original"
        }],
        ["goalDueDateEdit", {
            value: "2026-08-31"
        }]
    ]);

    globalThis.document = {
        getElementById: id =>
            elements.get(id) ?? null
    };

    try {
        const view = Object.create(
            MainView.prototype
        );

        assert.equal(
            view.hasUnsavedGoalEdit({
                title: "Objetivo original",
                description:
                    "Descripción original",
                dueDate: "2026-08-31"
            }),
            true
        );
    } finally {
        globalThis.document = originalDocument;
    }
});

test("la sincronización consulta también los formularios transitorios", () => {
    const occurrences = appSource.match(
        /hasActiveTransientForm/g
    ) ?? [];

    assert.equal(occurrences.length, 2);
});
