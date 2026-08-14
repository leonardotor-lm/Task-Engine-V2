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
    assert.match(mainViewSource, /<strong>Mis tareas<\/strong>/);
    assert.match(
        mainViewSource,
        /Salir de la aplicación/
    );
    assert.match(
        sidebarSource,
        /Mis tareas — \$\{normalizedSidebarUserName\}/
    );
    assert.match(
        sidebarSource,
        /<h3>\$\{escapeHtml\(sidebarTitle\)\}<\/h3>/
    );
    assert.doesNotMatch(mainViewSource, /Task Engine/);
});

test("el escritorio no conserva un encabezado exterior", () => {
    assert.doesNotMatch(indexHtml, /<h1[\s>]/);
    assert.doesNotMatch(indexHtml, /Task Engine V2/);
});
