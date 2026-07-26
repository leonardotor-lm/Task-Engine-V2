import test from "node:test";
import assert from "node:assert/strict";

import { App } from "../src/core/App.js";
import {
    AutomaticSyncAction
} from "../src/core/AutomaticSyncPolicy.js";

test("la descarga automática vuelve a renderizar después de finalizar", async () => {

    const app = Object.create(App.prototype);
    const renderedStates = [];

    app.syncCheckInProgress = false;
    app.autoSyncInProgress = false;
    app.syncRemoteRevision = 1;
    app.syncRemoteUpdateAvailable = false;
    app.syncLastError = null;
    app.autoSyncBlockedFingerprint = null;

    app.syncConfig = {
        isConfigured: () => true
    };

    app.syncEngine = {
        async checkRemoteRevision() {
            return {
                remoteRevision: 2,
                updateAvailable: true
            };
        },
        async pull() {
            return {
                revision: 2
            };
        }
    };

    app.resolveAutomaticSyncAction =
        () => AutomaticSyncAction.PULL;

    app.resetTransientState = () => {};

    app.render = () => {
        renderedStates.push({
            checking:
                app.syncCheckInProgress,
            syncing:
                app.autoSyncInProgress,
            remoteRevision:
                app.syncRemoteRevision,
            updateAvailable:
                app.syncRemoteUpdateAvailable
        });
    };

    await app.checkRemoteStatus();

    assert.equal(
        renderedStates[0].checking,
        true
    );

    assert.deepEqual(
        renderedStates.at(-1),
        {
            checking: false,
            syncing: false,
            remoteRevision: 2,
            updateAvailable: false
        }
    );

});
