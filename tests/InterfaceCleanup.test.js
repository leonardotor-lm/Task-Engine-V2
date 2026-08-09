import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const rootStyles = fs.readFileSync(
    new URL("../styles.css", import.meta.url),
    "utf8"
);
const interfaceStyles = fs.readFileSync(
    new URL("../styles/task-interface.css", import.meta.url),
    "utf8"
);
const mobileEditorStyles = fs.readFileSync(
    new URL("../styles/task-editor-mobile.css", import.meta.url),
    "utf8"
);
const roadmap = fs.readFileSync(
    new URL("../docs/roadmap/PENDIENTES.md", import.meta.url),
    "utf8"
);

test("la estructura principal usa el viewport dinámico", () => {
    assert.match(rootStyles, /\.layout\s*\{[\s\S]*?height:\s*100dvh;/);
    assert.match(
        rootStyles,
        /padding-top:\s*calc\(52px \+ env\(safe-area-inset-top\)\)/
    );
    assert.match(rootStyles, /env\(safe-area-inset-left\)/);
    assert.match(rootStyles, /env\(safe-area-inset-right\)/);
});

test("los controles táctiles principales alcanzan 44 px", () => {
    assert.match(
        rootStyles,
        /\.mobileMenuButton\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;/
    );
    assert.match(
        interfaceStyles,
        /\.taskContextToolbarSummary\s*\{[\s\S]*?min-height:\s*44px;/
    );
    assert.match(
        interfaceStyles,
        /\.sidebar \.sidebarUnifiedGroup > summary\s*\{[\s\S]*?min-height:\s*44px;/
    );
    assert.match(
        mobileEditorStyles,
        /\.mobileTaskEditorPanelClose\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;/
    );
});

test("el registro cierra la PR 180 y habilita fecha de inicio", () => {
    assert.doesNotMatch(roadmap, /Creación de subtareas directamente en el editor/);
    assert.match(roadmap, /PR #180 abre el editor completo/);
    assert.match(
        roadmap,
        /Fecha de inicio y períodos[\s\S]*?\*\*Estado:\*\* Pendiente;/
    );
});
