import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    AccessibilityStateController
} from "../src/ui/AccessibilityStateController.js";

class FakeElement {

    constructor({
        classes = [],
        label = null,
        open = false,
        dataset = {},
        id = ""
    } = {}) {

        this.attributes = new Map();
        this.classes = new Set(classes);
        this.classList = {
            contains: value =>
                this.classes.has(value)
        };
        this.open = open;
        this.dataset = dataset;
        this.id = id;

        if (label !== null) {
            this.setAttribute(
                "aria-label",
                label
            );
        }

    }

    setAttribute(name, value) {
        this.attributes.set(
            name,
            String(value)
        );
    }

    getAttribute(name) {
        return this.attributes.has(name)
            ? this.attributes.get(name)
            : null;
    }

    removeAttribute(name) {
        this.attributes.delete(name);
    }

}

function createDocument({
    navigation = [],
    toggles = [],
    ids = {},
    goalDrawer = null
} = {}) {

    return {
        querySelectorAll(selector) {
            if (
                selector ===
                ".sidebarButton, .showCustomFilter, .showGoalStatus"
            ) {
                return navigation;
            }
            if (selector === ".toggleSubtasks") {
                return toggles;
            }
            return [];
        },
        getElementById(id) {
            return ids[id] ?? null;
        },
        querySelector(selector) {
            if (selector === ".goalDrawer") {
                return goalDrawer;
            }
            return null;
        }
    };

}

test("marca como página actual sólo la navegación activa", () => {

    const active = new FakeElement({
        classes: ["active"]
    });
    const inactive = new FakeElement();
    inactive.setAttribute(
        "aria-current",
        "page"
    );

    const controller =
        new AccessibilityStateController(
            null,
            {
                documentRef: createDocument({
                    navigation: [
                        active,
                        inactive
                    ]
                })
            }
        );

    controller.enhanceCurrentNavigation();

    assert.equal(
        active.getAttribute("aria-current"),
        "page"
    );
    assert.equal(
        inactive.getAttribute("aria-current"),
        null
    );

});

test("expone el estado expandido de las subtareas", () => {

    const expanded = new FakeElement({
        label: "Contraer subtareas"
    });
    const collapsed = new FakeElement({
        label: "Expandir subtareas"
    });

    const controller =
        new AccessibilityStateController(
            null,
            {
                documentRef: createDocument({
                    toggles: [
                        expanded,
                        collapsed
                    ]
                })
            }
        );

    controller.enhanceTaskExpansion();

    assert.equal(
        expanded.getAttribute(
            "aria-expanded"
        ),
        "true"
    );
    assert.equal(
        collapsed.getAttribute(
            "aria-expanded"
        ),
        "false"
    );

});

test("relaciona disparadores con sus diálogos y refleja si están abiertos", () => {

    const advancedTrigger =
        new FakeElement();
    const toolsTrigger =
        new FakeElement();
    const settingsTrigger =
        new FakeElement();

    const advancedDialog =
        new FakeElement({
            dataset: {
                requestedOpen: "true"
            }
        });
    const toolsDialog =
        new FakeElement();
    const settingsDialog =
        new FakeElement({ open: true });

    const controller =
        new AccessibilityStateController(
            null,
            {
                documentRef: createDocument({
                    ids: {
                        toggleAdvancedSearch:
                            advancedTrigger,
                        advancedSearchDialog:
                            advancedDialog,
                        openTaskTools:
                            toolsTrigger,
                        taskToolsDialog:
                            toolsDialog,
                        openSettings:
                            settingsTrigger,
                        settingsDialog
                    }
                })
            }
        );

    controller.enhanceDialogTriggers();

    assert.equal(
        advancedTrigger.getAttribute(
            "aria-expanded"
        ),
        "true"
    );
    assert.equal(
        toolsTrigger.getAttribute(
            "aria-expanded"
        ),
        "false"
    );
    assert.equal(
        settingsTrigger.getAttribute(
            "aria-expanded"
        ),
        "true"
    );

    for (const [
        trigger,
        dialogId
    ] of [
        [
            advancedTrigger,
            "advancedSearchDialog"
        ],
        [toolsTrigger, "taskToolsDialog"],
        [settingsTrigger, "settingsDialog"]
    ]) {
        assert.equal(
            trigger.getAttribute(
                "aria-haspopup"
            ),
            "dialog"
        );
        assert.equal(
            trigger.getAttribute(
                "aria-controls"
            ),
            dialogId
        );
    }

});

test("relaciona Editar objetivo con el panel lateral cuando está abierto", () => {

    const trigger = new FakeElement();
    const drawer = new FakeElement();

    const controller =
        new AccessibilityStateController(
            null,
            {
                documentRef: createDocument({
                    ids: { editGoal: trigger },
                    goalDrawer: drawer
                })
            }
        );

    controller.enhanceGoalEditorTrigger();

    assert.equal(
        trigger.getAttribute(
            "aria-expanded"
        ),
        "true"
    );
    assert.equal(
        drawer.id,
        "goalEditorPanel"
    );
    assert.equal(
        trigger.getAttribute(
            "aria-controls"
        ),
        "goalEditorPanel"
    );

});

test("el controlador se ejecuta después de cada render", () => {

    let renders = 0;
    let enhancements = 0;

    const app = {
        mainView: {
            render() {
                renders += 1;
            }
        }
    };

    const controller =
        new AccessibilityStateController(
            app,
            { documentRef: null }
        );

    controller.enhance = () => {
        enhancements += 1;
    };

    controller.start();
    app.mainView.render({});

    assert.equal(renders, 1);
    assert.equal(enhancements, 1);

});

test("main carga el controlador de estados accesibles", async () => {

    const main = await readFile(
        new URL(
            "../src/main.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        main,
        /AccessibilityStateController/
    );
    assert.match(
        main,
        /accessibilityStateController\.start\(\)/
    );

});
