import test from "node:test";
import assert from "node:assert/strict";

import {
    OfflineSyncRecoveryController
} from "../src/ui/OfflineSyncRecoveryController.js";

class WindowStub {

    constructor(online = true) {
        this.navigator = { onLine: online };
        this.listeners = new Map();
    }

    addEventListener(type, listener) {
        this.listeners.set(type, listener);
    }

    removeEventListener(type) {
        this.listeners.delete(type);
    }

    dispatch(type) {
        this.navigator.onLine = type !== "offline";
        this.listeners.get(type)?.();
    }

}

function createHarness({ online = true } = {}) {

    const windowRef = new WindowStub(online);
    const timers = [];
    let checks = 0;
    let shouldFail = false;
    let shouldConflict = false;
    let blocking = false;
    const app = {
        syncOffline: false,
        syncLastError: null,
        syncRemoteUpdateAvailable: false,
        selectedGoal: null,
        selectedTask: null,
        syncConfig: {
            isConfigured: () => true
        },
        mainView: {
            hasActiveEntityEdit: () => blocking,
            hasActiveEntityCreation: () => false,
            hasActiveTransientForm: () => false,
            hasUnsavedTaskEdit: () => false
        },
        render() {},
        async checkRemoteStatus() {
            checks += 1;
            this.syncLastError = shouldFail
                ? "Servicio temporalmente inaccesible"
                : null;
            this.syncRemoteUpdateAvailable =
                shouldConflict;
            return { ok: !shouldFail };
        },
        async runAutomaticPush() {
            this.syncLastError = shouldFail
                ? "No se pudo guardar"
                : null;
        }
    };
    const controller =
        new OfflineSyncRecoveryController(app, {
            windowRef,
            retryDelays: [5, 15, 30],
            setTimeoutFn(callback, delay) {
                const timer = {
                    callback,
                    delay,
                    cancelled: false
                };
                timers.push(timer);
                return timer;
            },
            clearTimeoutFn(timer) {
                timer.cancelled = true;
            }
        });

    return {
        app,
        controller,
        windowRef,
        timers,
        getChecks: () => checks,
        setFailure(value) {
            shouldFail = value;
        },
        setConflict(value) {
            shouldConflict = value;
        },
        setBlocking(value) {
            blocking = value;
        },
        async runTimer(index = timers.length - 1) {
            await timers[index].callback();
            await Promise.resolve();
        }
    };

}

test("no consulta la nube mientras el dispositivo está sin conexión", async () => {

    const harness = createHarness({ online: false });
    harness.controller.start();

    const result = await harness.app.checkRemoteStatus();

    assert.equal(result, null);
    assert.equal(harness.getChecks(), 0);
    assert.equal(harness.app.syncOffline, true);
    assert.equal(harness.app.syncLastError, null);

});

test("comprueba la nube automáticamente al recuperar internet", async () => {

    const harness = createHarness({ online: false });
    harness.controller.start();
    harness.windowRef.dispatch("online");
    await Promise.resolve();

    assert.equal(harness.getChecks(), 1);
    assert.equal(harness.app.syncOffline, false);

});

test("reintenta gradualmente si la primera recuperación falla", async () => {

    const harness = createHarness();
    harness.controller.start();
    harness.setFailure(true);

    await harness.app.checkRemoteStatus();

    assert.equal(harness.timers.length, 1);
    assert.equal(harness.timers[0].delay, 5);

    harness.setFailure(false);
    await harness.runTimer(0);

    assert.equal(harness.getChecks(), 2);
    assert.equal(harness.app.syncLastError, null);
    assert.equal(harness.controller.retryTimer, null);
    assert.equal(harness.controller.retryAttempt, 0);

});

test("detiene la serie automática después del máximo de intentos", async () => {

    const harness = createHarness();
    harness.controller.retryDelays = [5, 15];
    harness.controller.start();
    harness.setFailure(true);

    await harness.app.checkRemoteStatus();
    await harness.runTimer(0);
    await harness.runTimer(1);

    assert.equal(harness.getChecks(), 3);
    assert.equal(harness.timers.length, 2);
    assert.equal(harness.controller.retryTimer, null);

});

test("pospone el reintento mientras hay un editor activo", async () => {

    const harness = createHarness({ online: false });
    harness.controller.start();
    harness.setBlocking(true);
    harness.windowRef.dispatch("online");

    assert.equal(harness.getChecks(), 0);
    assert.equal(harness.timers.length, 1);

    await harness.runTimer(0);

    assert.equal(harness.getChecks(), 0);
    assert.equal(harness.timers.length, 2);

    harness.setBlocking(false);
    await harness.runTimer(1);

    assert.equal(harness.getChecks(), 1);

});

test("no programa reintentos para un conflicto real", async () => {

    const harness = createHarness();
    harness.controller.start();
    harness.setConflict(true);

    await harness.app.checkRemoteStatus();

    assert.equal(harness.timers.length, 0);

});
