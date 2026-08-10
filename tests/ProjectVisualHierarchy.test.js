import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const styles = fs.readFileSync(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

const workspaceStyles = fs.readFileSync(
    new URL(
        "../styles/goal-workspace.css",
        import.meta.url
    ),
    "utf8"
);

test("la vista de proyecto usa una jerarquía lineal sin cajas", () => {
    assert.match(
        styles,
        /\.projectWorkspace \.task\s*\{[\s\S]*?border-bottom:\s*0/
    );
    assert.match(
        styles,
        /\.projectWorkspace \.task\.subtask::before\s*\{[\s\S]*?border-left:\s*1px solid var\(--color-border\)/
    );
    assert.match(
        styles,
        /\.projectWorkspace \.taskList\s*\{[\s\S]*?border-top:\s*0/
    );
});

test("los proyectos internos se distinguen sin una superficie adicional", () => {
    assert.match(
        styles,
        /\.projectWorkspace \.projectTask \.taskTitle\s*\{[\s\S]*?font-weight:\s*650/
    );
    assert.doesNotMatch(
        styles,
        /\.projectWorkspace \.projectTask\s*\{[\s\S]*?background:/
    );
});

test("objetivos y proyectos comparten el lenguaje visual del breadcrumb", () => {
    assert.match(
        workspaceStyles,
        /\.goalBreadcrumb,\s*\n\.projectBreadcrumb\s*\{/
    );
    assert.match(
        workspaceStyles,
        /\.projectBreadcrumb \.projectBreadcrumbLink/
    );
    assert.match(
        workspaceStyles,
        /\.projectBreadcrumbCurrent/
    );
});

test("la ruta móvil conserva objetivos táctiles sin deformar el encabezado", () => {
    assert.match(
        workspaceStyles,
        /@media \(max-width: 760px\)[\s\S]*?\.goalBreadcrumb,[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?overflow-x:\s*auto;/
    );
    assert.match(
        workspaceStyles,
        /\.goalBreadcrumb \.goalBreadcrumbLink,[\s\S]*?min-height:\s*44px;/
    );
});
