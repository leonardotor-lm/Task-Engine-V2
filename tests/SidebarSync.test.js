import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import { Sidebar } from "../src/ui/Sidebar.js";

function renderSync({
    configured = false,
    url = "",
    revision = 0,
    pendingChanges = false,
    lastSuccess = "",
    remoteRevision = null,
    remoteUpdateAvailable = false
} = {}) {

    return new Sidebar().render(
        View.INBOX,
        "",
        [],
        [],
        [],
        {},
        "MANUAL",
        false,
        configured,
        url,
        revision,
        pendingChanges,
        lastSuccess,
        remoteRevision,
        remoteUpdateAvailable
    );

}

test("muestra el formulario cuando no hay conexión", () => {

    const html = renderSync();

    assert.match(html, /Sin configurar/);
    assert.match(html, /id="syncConfigForm"/);
    assert.doesNotMatch(html, /id="pushToCloud"/);

});

test("muestra acciones y revisión cuando está conectada", () => {

    const html = renderSync({
        configured: true,
        url:
            "https://script.google.com/macros/s/test/exec",
        revision: 4
    });

    assert.match(html, /Sincronizada · rev. 4/);
    assert.match(html, /id="pushToCloud"/);
    assert.match(html, /id="pullFromCloud"/);
    assert.match(
        html,
        /id="clearSyncConfig"/
    );

});

test("destaca cambios locales pendientes", () => {

    const html = renderSync({
        configured: true,
        revision: 4,
        pendingChanges: true,
        lastSuccess:
            "2026-07-24T15:00:00.000Z"
    });

    assert.match(
        html,
        /Cambios pendientes · rev. 4/
    );

    assert.match(
        html,
        /class="syncStatus pending"/
    );

    assert.match(
        html,
        /Última sincronización:/
    );

});

test("avisa cuando existe una revisión remota nueva", () => {

    const html = renderSync({
        configured: true,
        revision: 4,
        remoteRevision: 6,
        remoteUpdateAvailable: true
    });

    assert.match(
        html,
        /Actualización disponible · rev. 6/
    );

    assert.match(
        html,
        /class="syncStatus remote"/
    );

});

test("avisa si coinciden cambios locales y remotos", () => {

    const html = renderSync({
        configured: true,
        revision: 4,
        pendingChanges: true,
        remoteRevision: 6,
        remoteUpdateAvailable: true
    });

    assert.match(
        html,
        /Cambios locales y remotos · nube rev. 6/
    );

});

test("no inserta el token guardado en el HTML", () => {

    const html = renderSync({
        configured: true,
        url:
            "https://script.google.com/macros/s/test/exec",
        revision: 1
    });

    assert.match(
        html,
        /Dejar vacío para conservarlo/
    );

    assert.doesNotMatch(
        html,
        /leo_api_key_storage_key/
    );

});

test("escapa la URL antes de mostrarla", () => {

    const html = renderSync({
        url: 'https://example.com/?value="test"'
    });

    assert.match(html, /&quot;test&quot;/);
    assert.doesNotMatch(
        html,
        /value="https:\/\/example\.com\/\?value="test""/
    );

});
