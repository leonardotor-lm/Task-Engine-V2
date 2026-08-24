import test from "node:test";
import assert from "node:assert/strict";

import {
    SyncFocusWatcher
} from "../src/core/SyncFocusWatcher.js";

class EventTargetStub {

    constructor() {
        this.listeners = new Map();
    }

    addEventListener(type, listener) {
        this.listeners.set(type, listener);
    }

    removeEventListener(type) {
        this.listeners.delete(type);
    }

    focus() {
        this.listeners.get("focus")?.();
    }

    reconnect() {
        this.listeners.get("online")?.();
    }

}

class DocumentStub extends EventTargetStub {

    constructor() {
        super();
        this.visibilityState = "hidden";
    }

    show() {
        this.visibilityState = "visible";
        this.listeners.get(
            "visibilitychange"
        )?.();
    }

}

test("comprueba la nube al recuperar el foco", () => {

    const target = new EventTargetStub();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    target.focus();

    assert.equal(checks, 1);

});

test("comprueba la nube al recuperar la conexión", () => {

    const target = new EventTargetStub();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    target.reconnect();

    assert.equal(checks, 1);

});

test("comprueba la nube cuando la aplicación vuelve a ser visible", () => {

    const target = new EventTargetStub();
    const documentRef = new DocumentStub();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        documentRef,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    documentRef.show();

    assert.equal(checks, 1);

});

test("no registra dos veces el mismo observador", () => {

    const target = new EventTargetStub();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    watcher.start();
    target.focus();
    target.reconnect();

    assert.equal(checks, 2);

});

test("deja de comprobar después de detenerse", () => {

    const target = new EventTargetStub();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    watcher.stop();
    target.focus();
    target.reconnect();

    assert.equal(checks, 0);

});
