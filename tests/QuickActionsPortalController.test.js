import test from "node:test";
import assert from "node:assert/strict";

import {
    QuickActionsPortalController
} from "../src/ui/QuickActionsPortalController.js";

function createEnvironment() {

    const listeners = new Map();

    const parent = {
        isConnected: true,
        children: [],
        append(element) {
            element.parentNode = this;
            this.children.push(element);
        },
        insertBefore(element, sibling) {
            element.parentNode = this;
            this.children.splice(
                this.children.indexOf(sibling),
                0,
                element
            );
        }
    };

    const body = {
        children: [],
        append(element) {
            element.parentNode?.children?.splice(
                element.parentNode.children.indexOf(
                    element
                ),
                1
            );
            element.parentNode = this;
            this.children.push(element);
        }
    };

    const menu = {
        dataset: {},
        classList: {
            values: new Set(),
            add(value) { this.values.add(value); },
            remove(value) { this.values.delete(value); }
        },
        parentNode: parent,
        nextSibling: null,
        remove() {
            this.removed = true;
        }
    };

    const details = {
        dataset: { id: "task-1" },
        open: false,
        querySelector() { return menu; },
        addEventListener(type, handler) {
            listeners.set(type, handler);
        },
        removeEventListener(type, handler) {
            if (listeners.get(type) === handler) {
                listeners.delete(type);
            }
        }
    };

    parent.children.push(menu);

    const controller =
        new QuickActionsPortalController({
            documentRef: {
                body,
                querySelectorAll() {
                    return [details];
                }
            },
            windowRef: {
                matchMedia() {
                    return { matches: true };
                }
            }
        });

    return {
        controller,
        listeners,
        parent,
        body,
        menu,
        details
    };

}

test("monta el panel móvil en body al abrirlo", () => {

    const environment = createEnvironment();

    environment.controller.bind();
    environment.details.open = true;
    environment.listeners.get("toggle")();

    assert.equal(
        environment.menu.parentNode,
        environment.body
    );
    assert.equal(
        environment.menu.dataset
            .quickActionsOwnerId,
        "task-1"
    );
    assert.equal(
        environment.menu.classList.values.has(
            "quickMoreMenuPortaled"
        ),
        true
    );

});

test("restaura el panel y su propietario al cerrarlo", () => {

    const environment = createEnvironment();

    environment.controller.bind();
    environment.details.open = true;
    environment.listeners.get("toggle")();

    const control = {
        closest(selector) {
            return selector === ".quickMoreMenu"
                ? environment.menu
                : null;
        }
    };

    assert.equal(
        environment.controller.getOwner(control),
        environment.details
    );

    environment.details.open = false;
    environment.listeners.get("toggle")();

    assert.equal(
        environment.menu.parentNode,
        environment.parent
    );
    assert.equal(
        environment.menu.dataset
            .quickActionsOwnerId,
        undefined
    );

});

test("cleanup retira el portal antes de reconstruir la vista", () => {

    const environment = createEnvironment();

    environment.controller.bind();
    environment.details.open = true;
    environment.listeners.get("toggle")();
    environment.controller.cleanup();

    assert.equal(
        environment.menu.parentNode,
        environment.parent
    );
    assert.equal(environment.listeners.size, 0);

});
