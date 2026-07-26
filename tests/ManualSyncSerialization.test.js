import test from "node:test";
import assert from "node:assert/strict";

import { App } from "../src/core/App.js";

function createApp() {

    const app = Object.create(App.prototype);

    app.autoSyncInProgress = false;
    app.syncCheckInProgress = false;
    app.syncRemoteRevision = 2;
    app.syncRemoteUpdateAvailable = true;
    app.autoSyncBlockedFingerprint =
        "blocked";
    app.syncLastError = null;
    app.cancelAutomaticSync = () => {};
    app.renderCount = 0;
    app.render = () => {
        app.renderCount += 1;
    };
    app.resetTransientState = () => {};
    app.syncEngine = {
        isConflict: () => false
    };

    return app;

}

test("una operación manual bloquea la sincronización automática hasta finalizar", async () => {

    const app = createApp();

    let resolveOperation;

    const operation = new Promise(resolve => {
        resolveOperation = resolve;
    });

    const resultPromise = app.runManualSync(
        () => operation
    );

    assert.equal(
        app.autoSyncInProgress,
        true
    );
    assert.equal(app.renderCount, 1);

    resolveOperation({
        revision: 3
    });

    const result = await resultPromise;

    assert.equal(result.revision, 3);
    assert.equal(
        app.autoSyncInProgress,
        false
    );
    assert.equal(
        app.syncRemoteRevision,
        3
    );
    assert.equal(
        app.syncRemoteUpdateAvailable,
        false
    );
    assert.equal(
        app.autoSyncBlockedFingerprint,
        null
    );
    assert.equal(app.renderCount, 2);

});

test("la comprobación de foco no comienza durante una operación manual", async () => {

    const app = createApp();
    let remoteChecks = 0;

    app.autoSyncInProgress = true;
    app.syncConfig = {
        isConfigured: () => true
    };
    app.syncEngine.checkRemoteRevision =
        async () => {
            remoteChecks += 1;
        };

    await app.checkRemoteStatus();

    assert.equal(remoteChecks, 0);

});

test("un conflicto manual conserva el estado para que el usuario decida", async () => {

    const app = createApp();

    const conflict = new Error(
        "Hay cambios remotos."
    );
    conflict.remoteRevision = 7;

    app.syncEngine.isConflict =
        error => error === conflict;

    await assert.rejects(
        app.runManualSync(
            async () => {
                throw conflict;
            }
        ),
        /Hay cambios remotos/
    );

    assert.equal(
        app.autoSyncInProgress,
        false
    );
    assert.equal(
        app.syncRemoteRevision,
        7
    );
    assert.equal(
        app.syncRemoteUpdateAvailable,
        true
    );
    assert.equal(
        app.syncLastError,
        "Hay cambios remotos."
    );

});
