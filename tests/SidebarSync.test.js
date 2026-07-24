import test from "node:test";
import assert from "node:assert/strict";

import { View } from "../src/core/View.js";
import { Sidebar } from "../src/ui/Sidebar.js";

function renderSync({
    configured = false,
    url = "",
    revision = 0
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
        revision
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

    assert.match(html, /Conectada · rev. 4/);
    assert.match(html, /id="pushToCloud"/);
    assert.match(html, /id="pullFromCloud"/);
    assert.match(
        html,
        /id="clearSyncConfig"/
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
