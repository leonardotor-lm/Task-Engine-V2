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

function createClock(initial = 0) {
    let current = initial;

    return {
        now: () => current,
        advance: milliseconds => {
            current += milliseconds;
        }
    };
}

test("no vuelve a comprobar la nube antes de dos minutos", () => {

    const target = new EventTargetStub();
    const clock = createClock();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        now: clock.now,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    clock.advance(60 * 1000);
    target.focus();

    assert.equal(checks, 0);

});

test("comprueba la nube al recuperar el foco después de dos minutos", () => {

    const target = new EventTargetStub();
    const clock = createClock();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        now: clock.now,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    clock.advance(2 * 60 * 1000);
    target.focus();

    assert.equal(checks, 1);

});

test("focus y visibilidad comparten el mismo período de enfriamiento", () => {

    const target = new EventTargetStub();
    const documentRef = new DocumentStub();
    const clock = createClock();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        documentRef,
        now: clock.now,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    clock.advance(2 * 60 * 1000);
    documentRef.show();
    target.focus();

    assert.equal(checks, 1);

});

test("comprueba la nube inmediatamente al recuperar la conexión", () => {

    const target = new EventTargetStub();
    const clock = createClock();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        now: clock.now,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    clock.advance(1000);
    target.reconnect();

    assert.equal(checks, 1);

});

test("recuperar la conexión reinicia el período de enfriamiento", () => {

    const target = new EventTargetStub();
    const clock = createClock();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        now: clock.now,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    clock.advance(60 * 1000);
    target.reconnect();
    clock.advance(60 * 1000);
    target.focus();

    assert.equal(checks, 1);

});

test("no registra dos veces el mismo observador", () => {

    const target = new EventTargetStub();
    const clock = createClock();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        now: clock.now,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    watcher.start();
    clock.advance(2 * 60 * 1000);
    target.focus();
    target.reconnect();

    assert.equal(checks, 2);

});

test("deja de comprobar después de detenerse", () => {

    const target = new EventTargetStub();
    const clock = createClock();
    let checks = 0;

    const watcher = new SyncFocusWatcher({
        target,
        now: clock.now,
        onFocus: () => {
            checks += 1;
        }
    });

    watcher.start();
    watcher.stop();
    clock.advance(2 * 60 * 1000);
    target.focus();
    target.reconnect();

    assert.equal(checks, 0);

});
