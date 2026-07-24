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

    assert.equal(checks, 1);

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

    assert.equal(checks, 0);

});
