import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const indexHtml = fs.readFileSync(
    new URL("../index.html", import.meta.url),
    "utf8"
);
const mainViewSource = fs.readFileSync(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);
const sidebarSource = fs.readFileSync(
    new URL("../src/ui/Sidebar.js", import.meta.url),
    "utf8"
);

test("la interfaz muestra Mis tareas como nombre de la aplicación", () => {
    assert.match(indexHtml, /<title>Mis tareas<\/title>/);
    assert.match(
        mainViewSource,
        /import \{ escapeHtml \} from "\.\/escapeHtml\.js";/
    );
    assert.match(
        mainViewSource,
        /const applicationTitle =[\s\S]*?String\(sidebarTitle\)\.trim\(\)[\s\S]*?\|\|[\s\S]*?"Mis tareas"/
    );
    assert.match(
        mainViewSource,
        /<strong>\$\{escapeHtml\(applicationTitle\)\}<\/strong>/
    );
    assert.match(
        mainViewSource,
        /Salir de la aplicación/
    );
    assert.match(
        sidebarSource,
        /normalizedSidebarTitle \|\| "Mis tareas"/
    );
    assert.match(
        sidebarSource,
        /<h3>\$\{escapeHtml\(visibleSidebarTitle\)\}<\/h3>/
    );
    assert.doesNotMatch(mainViewSource, /Task Engine/);
});

test("el escritorio no conserva un encabezado exterior", () => {
    assert.doesNotMatch(indexHtml, /<h1[\s>]/);
    assert.doesNotMatch(indexHtml, /Task Engine V2/);
});
