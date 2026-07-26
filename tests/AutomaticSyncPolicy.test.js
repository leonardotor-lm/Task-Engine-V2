import test from "node:test";
import assert from "node:assert/strict";

import {
    AutomaticSyncAction,
    getAutomaticSyncAction
} from "../src/core/AutomaticSyncPolicy.js";

function decide(overrides = {}) {

    return getAutomaticSyncAction({
        configured: true,
        remoteChecked: true,
        localPending: false,
        remoteUpdateAvailable: false,
        inProgress: false,
        ...overrides
    });

}

test("sube automáticamente cuando sólo existen cambios locales", () => {

    assert.equal(
        decide({
            localPending: true
        }),
        AutomaticSyncAction.PUSH
    );

});

test("descarga automáticamente cuando sólo existen cambios remotos", () => {

    assert.equal(
        decide({
            remoteUpdateAvailable: true
        }),
        AutomaticSyncAction.PULL
    );

});

test("no decide automáticamente cuando hay conflicto", () => {

    assert.equal(
        decide({
            localPending: true,
            remoteUpdateAvailable: true
        }),
        AutomaticSyncAction.CONFLICT
    );

});

test("espera la primera comprobación remota antes de subir", () => {

    assert.equal(
        decide({
            remoteChecked: false,
            localPending: true
        }),
        AutomaticSyncAction.NONE
    );

});

test("no sincroniza sin configuración ni durante otra operación", () => {

    assert.equal(
        decide({
            configured: false,
            localPending: true
        }),
        AutomaticSyncAction.NONE
    );

    assert.equal(
        decide({
            inProgress: true,
            localPending: true
        }),
        AutomaticSyncAction.NONE
    );

});

test("no realiza solicitudes cuando ambos estados coinciden", () => {

    assert.equal(
        decide(),
        AutomaticSyncAction.NONE
    );

});
