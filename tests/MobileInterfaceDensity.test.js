import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const index = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8"
);
const styles = await readFile(
    new URL("../styles/mobile-density.css", import.meta.url),
    "utf8"
);
const controller = await readFile(
    new URL(
        "../src/ui/MobileMainLayoutController.js",
        import.meta.url
    ),
    "utf8"
);

test("la interfaz móvil carga la capa de densidad al final de los estilos funcionales", () => {
    assert.match(
        index,
        /styles\/task-checkbox-alignment\.css[\s\S]*styles\/mobile-density\.css/
    );
});

test("la cabecera móvil reutiliza el nombre de la vista y oculta el título duplicado", () => {
    assert.match(
        controller,
        /syncMobileViewTitle\(\)/
    );
    assert.match(
        controller,
        /\.taskListHeading h2/
    );
    assert.match(
        styles,
        /\.mobileHeader strong\s*\{[\s\S]*?font-size:\s*18px;[\s\S]*?font-weight:\s*700;/
    );
    assert.match(
        styles,
        /\.taskListTitleSummary > h2\s*\{[\s\S]*?display:\s*none;/
    );
});

test("la lista móvil elimina separadores y destaca los encabezados de agrupación", () => {
    assert.match(
        styles,
        /\.task\s*\{[\s\S]*?border-bottom:\s*0 !important;/
    );
    assert.match(
        styles,
        /\.taskGroupHeader\s*\{[\s\S]*?font-size:\s*14px;[\s\S]*?font-weight:\s*700;/
    );
});

test("los controles icónicos móviles pierden el contorno y la barra se compacta", () => {
    assert.match(
        styles,
        /\.mobileMenuButton\s*\{[\s\S]*?width:\s*38px;[\s\S]*?border:\s*0;/
    );
    assert.match(
        styles,
        /\.mobileTaskToolbarAction,[\s\S]*?width:\s*38px !important;[\s\S]*?border:\s*0;/
    );
    assert.match(
        styles,
        /\.quickMoreMenu\s*\{[\s\S]*?gap:\s*4px;[\s\S]*?padding:\s*8px;/
    );
});

test("el control de la barra usa un chevron compacto sin texto visible", () => {
    assert.match(
        styles,
        /\.mobileTaskToolbarHeadingToggle\s*\{[\s\S]*?width:\s*24px;[\s\S]*?font-size:\s*0;/
    );
    assert.match(
        styles,
        /\.mobileTaskToolbarHeadingToggle::before\s*\{[\s\S]*?border-right:\s*1\.5px solid currentColor;[\s\S]*?rotate\(45deg\)/
    );
    assert.match(
        styles,
        /\.mobileTaskToolbarHeadingToggle\[aria-expanded="true"\]::before\s*\{[\s\S]*?rotate\(225deg\)/
    );
});
