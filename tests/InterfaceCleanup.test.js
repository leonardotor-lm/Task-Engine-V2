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

test("la interfaz móvil conserva una sola acción de alta y alinea sus herramientas", () => {
    assert.match(
        interfaceStyles,
        /#openTaskCreation,\s*\n\s*\.mobileFloatingTaskButton\s*\{[\s\S]*?position:\s*fixed;/
    );
    assert.match(
        interfaceStyles,
        /\.goalHeadingAction\s*\{\s*display:\s*none;/
    );
    assert.match(
        interfaceStyles,
        /\.taskContextToolbarSort\s*\{[\s\S]*?order:\s*initial;[\s\S]*?max-width:\s*118px;/
    );
    assert.match(
        interfaceStyles,
        /\.taskContextToolbarUtilities\s*\{[\s\S]*?order:\s*initial;[\s\S]*?margin-left:\s*0;/
    );
    assert.match(
        interfaceStyles,
        /\.taskContextToolbarSort > span\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?clip:\s*rect\(0, 0, 0, 0\);/
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
