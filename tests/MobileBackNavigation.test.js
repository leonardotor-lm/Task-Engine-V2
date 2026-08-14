import test from "node:test";
import assert from "node:assert/strict";
import { MainView } from "../src/ui/MainView.js";
import { Dialog } from "../src/components/Dialog.js";

test("la PWA arma el aviso de salida después de una interacción", async t => {

    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const originalConfirm = Dialog.confirmAsync;
    const listeners = new Map();
    const historyCalls = [];
    let confirmation = null;

    const windowRef = {
        navigator: {
            standalone: false,
            userActivation: {
                hasBeenActive: false
            }
        },
        history: {
            state: null,
            replaceState(state) {
                this.state = state;
                historyCalls.push(["replace", state]);
            },
            pushState(state) {
                this.state = state;
                historyCalls.push(["push", state]);
            },
            back() {
                historyCalls.push(["back"]);
            }
        },
        matchMedia(query) {
            return {
                matches:
                    query ===
                    "(display-mode: standalone)"
            };
        },
        onpopstate: null
    };

    globalThis.window = windowRef;
    globalThis.document = {
        addEventListener(type, callback) {
            listeners.set(type, callback);
        },
        querySelector() {
            return null;
        },
        getElementById() {
            return null;
        }
    };

    Dialog.confirmAsync = async (...args) => {
        confirmation = args;
        return true;
    };

    t.after(() => {
        globalThis.window = originalWindow;
        globalThis.document = originalDocument;
        Dialog.confirmAsync = originalConfirm;
    });

    const view = Object.create(MainView.prototype);
    view.mobileHistoryInitialized = false;
    view.mobileHistoryGuardArmed = false;
    view.mobileBackActivationBound = false;
    view.callbacks = {};

    view.setupMobileBackNavigation({
        selectedTask: null,
        goalEditorOpen: false,
        view: "TODAY"
    });

    assert.deepEqual(
        historyCalls.map(([type]) => type),
        ["replace"]
    );
    assert.equal(typeof listeners.get("pointerdown"), "function");

    listeners.get("pointerdown")();

    assert.deepEqual(
        historyCalls.map(([type]) => type),
        ["replace", "push"]
    );

    await windowRef.onpopstate();

    assert.deepEqual(
        historyCalls.map(([type]) => type),
        ["replace", "push", "back"]
    );
    assert.deepEqual(confirmation, [
        "Android puede requerir que presiones Atrás una vez más después de confirmar. ¿Querés continuar?",
        {
            title: "Salir de la aplicación",
            confirmLabel: "Continuar"
        }
    ]);

});

test("el aviso móvil también se activa fuera del modo instalado", t => {

    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const listeners = new Map();

    globalThis.window = {
        navigator: {
            userActivation: {
                hasBeenActive: false
            }
        },
        history: {
            state: null,
            replaceState() {},
            pushState() {}
        },
        matchMedia(query) {
            return {
                matches:
                    query ===
                    "(max-width: 760px)"
            };
        }
    };
    globalThis.document = {
        addEventListener(type, callback) {
            listeners.set(type, callback);
        }
    };

    t.after(() => {
        globalThis.window = originalWindow;
        globalThis.document = originalDocument;
    });

    const view = Object.create(MainView.prototype);
    view.mobileHistoryInitialized = false;
    view.mobileHistoryGuardArmed = false;
    view.mobileBackActivationBound = false;

    view.setupMobileBackNavigation({});

    assert.equal(typeof listeners.get("touchstart"), "function");
    assert.equal(typeof globalThis.window.onpopstate, "function");

});
