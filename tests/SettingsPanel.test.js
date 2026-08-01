import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { View } from "../src/core/View.js";
import { Sidebar } from "../src/ui/Sidebar.js";

const appSource = await readFile(
    new URL("../src/core/App.js", import.meta.url),
    "utf8"
);

const mainViewSource = await readFile(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);

const renderSettings = section =>
    new Sidebar().render(
        View.TODAY,
        "",
        [],
        null,
        [],
        [],
        {},
        "MANUAL",
        false,
        false,
        "",
        0,
        false,
        "",
        null,
        false,
        false,
        false,
        null,
        false,
        false,
        "",
        [],
        null,
        {},
        false,
        false,
        true,
        true,
        section
    );

test("configuración ofrece tres accesos independientes", () => {

    const html = renderSettings(null);

    assert.match(html, /id="openSettings"/);
    assert.match(html, /data-section="organization"/);
    assert.match(html, /data-section="sync"/);
    assert.match(html, /data-section="backup"/);
    assert.doesNotMatch(html, /id="syncConfigForm"/);

});

test("organización reúne sus tres administradores", () => {

    const html = renderSettings("organization");

    assert.match(html, /id="manageAreas"/);
    assert.match(html, /id="manageContexts"/);
    assert.match(html, /id="manageTags"/);
    assert.match(html, /id="backSettings"/);

});

test("sincronización y copia se muestran sólo al elegirlas", () => {

    assert.match(
        renderSettings("sync"),
        /id="syncConfigForm"/
    );
    assert.match(
        renderSettings("backup"),
        /id="exportBackup"/
    );

});

test("el panel tiene apertura cierre y presentación responsive", () => {

    assert.match(
        appSource,
        /onOpenSettings:[\s\S]*?settingsDialogOpen = true/
    );
    assert.match(
        appSource,
        /onCloseSettings:[\s\S]*?settingsDialogOpen = false/
    );
    assert.match(
        mainViewSource,
        /settingsDialog\.showModal\(\)[\s\S]*?settingsDialog\.show\(\)/
    );

});
