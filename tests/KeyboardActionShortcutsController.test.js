import test from "node:test";
import assert from "node:assert/strict";
import {
    KeyboardActionShortcutsController
} from "../src/ui/KeyboardActionShortcutsController.js";

function createEvent(key, target, extras = {}) {
    return {
        key,
        target,
        defaultPrevented: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        prevented: false,
        preventDefault() {
            this.prevented = true;
        },
        ...extras
    };
}

function createControl() {
    return {
        disabled: false,
        clicked: 0,
        focused: 0,
        selected: 0,
        click() {
            this.clicked += 1;
        },
        focus() {
            this.focused += 1;
        },
        select() {
            this.selected += 1;
        }
    };
}

function createDocument({
    newTaskButton = null,
    searchInput = null
} = {}) {
    const listeners = new Map();

    return {
        addEventListener(type, handler) {
            listeners.set(type, handler);
        },
        removeEventListener(type) {
            listeners.delete(type);
        },
        listener(type) {
            return listeners.get(type);
        },
        getElementById(id) {
            if (id === "openTaskCreation") {
                return newTaskButton;
            }
            if (id === "taskSearchInput") {
                return searchInput;
            }
            return null;
        }
    };
}

function createTarget(tagName = "DIV") {
    return {
        tagName,
        isContentEditable: false,
        closest() {
            return null;
        }
    };
}

test("N abre Nueva tarea", () => {
    const button = createControl();
    const documentRef = createDocument({
        newTaskButton: button
    });
    const controller =
        new KeyboardActionShortcutsController(
            {},
            { documentRef }
        );
    const event = createEvent(
        "n",
        createTarget()
    );

    controller.handleKeydown(event);

    assert.equal(event.prevented, true);
    assert.equal(button.clicked, 1);
});

test("/ enfoca y selecciona la búsqueda simple", () => {
    const searchInput = createControl();
    const controller =
        new KeyboardActionShortcutsController(
            {},
            {
                documentRef: createDocument({
                    searchInput
                })
            }
        );
    const event = createEvent(
        "/",
        createTarget()
    );

    controller.handleKeydown(event);

    assert.equal(event.prevented, true);
    assert.equal(searchInput.focused, 1);
    assert.equal(searchInput.selected, 1);
});

test("C completa la tarea enfocada usando su control existente", () => {
    const checkbox = createControl();
    const row = createTarget("LI");
    row.classList = {
        contains(name) {
            return name === "task";
        }
    };
    row.querySelector = selector =>
        selector === ".taskCompleteCheckbox"
            ? checkbox
            : null;

    const controller =
        new KeyboardActionShortcutsController(
            {},
            { documentRef: createDocument() }
        );
    const event = createEvent("c", row);

    controller.handleKeydown(event);

    assert.equal(event.prevented, true);
    assert.equal(checkbox.clicked, 1);
});

test("no ejecuta atajos dentro de campos editables", () => {
    const button = createControl();
    const controller =
        new KeyboardActionShortcutsController(
            {},
            {
                documentRef: createDocument({
                    newTaskButton: button
                })
            }
        );

    for (const tagName of [
        "INPUT",
        "TEXTAREA",
        "SELECT"
    ]) {
        controller.handleKeydown(
            createEvent(
                "n",
                createTarget(tagName)
            )
        );
    }

    assert.equal(button.clicked, 0);
});

test("no intercepta combinaciones con modificadores", () => {
    const button = createControl();
    const controller =
        new KeyboardActionShortcutsController(
            {},
            {
                documentRef: createDocument({
                    newTaskButton: button
                })
            }
        );

    controller.handleKeydown(
        createEvent(
            "n",
            createTarget(),
            { ctrlKey: true }
        )
    );
    controller.handleKeydown(
        createEvent(
            "n",
            createTarget(),
            { altKey: true }
        )
    );

    assert.equal(button.clicked, 0);
});

test("start y stop administran un único listener global", () => {
    const documentRef = createDocument();
    const controller =
        new KeyboardActionShortcutsController(
            {},
            { documentRef }
        );

    controller.start();
    controller.start();

    assert.equal(
        typeof documentRef.listener("keydown"),
        "function"
    );

    controller.stop();

    assert.equal(
        documentRef.listener("keydown"),
        undefined
    );
});
