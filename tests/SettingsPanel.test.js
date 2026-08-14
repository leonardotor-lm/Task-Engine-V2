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

const renderSettings = (
    section,
    sidebarUserName = ""
) =>
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
        section,
        sidebarUserName
    );

test("configuración ofrece cuatro accesos independientes", () => {

    const html = renderSettings(null);

    assert.match(html, /id="openSettings"/);
    assert.match(html, /data-section="organization"/);
    assert.match(html, /data-section="sync"/);
    assert.match(html, /data-section="backup"/);
    assert.match(html, /data-section="application"/);
    assert.doesNotMatch(html, /id="syncConfigForm"/);

});

test("organización reúne sus tres administradores", () => {

    const html = renderSettings("organization");

    assert.match(html, /data-section="areas"/);
    assert.match(html, /data-section="contexts"/);
    assert.match(html, /data-section="tags"/);
    assert.match(html, /id="backSettings"/);

});

test("los administradores se renderizan dentro de configuración", () => {

    const areas = renderSettings("areas");
    const contexts = renderSettings("contexts");
    const tags = renderSettings("tags");

    assert.match(areas, /class="settingsEntityManager entityManager"/);
    assert.match(contexts, /Nuevo contexto/);
    assert.match(tags, /Nueva etiqueta/);
    assert.doesNotMatch(areas, /<main class="content entityManager">/);

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

test("aplicación ofrece la instalación de la PWA", () => {

    const html = renderSettings(
        "application",
        "Leo"
    );

    assert.match(html, /id="installApp"/);
    assert.match(html, /id="pwaInstallDescription"/);
    assert.match(html, /id="sidebarUserNameForm"/);
    assert.match(html, /value="Leo"/);
    assert.match(html, /<h3>Mis tareas — Leo<\/h3>/);

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

test("los eventos reciben la sección activa de configuración", () => {

    assert.match(
        mainViewSource,
        /bindEvents\(state\)[\s\S]*?const \{[\s\S]*?settingsSection,[\s\S]*?\} = state;/
    );
    assert.match(
        mainViewSource,
        /settingsEntityViews\[settingsSection\]/
    );

});
