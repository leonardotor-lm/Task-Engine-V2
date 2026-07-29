import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const styles = fs.readFileSync(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("los controles interactivos comparten un foco visible", () => {
    assert.match(
        styles,
        /:where\([\s\S]*?button,[\s\S]*?summary,[\s\S]*?\[tabindex\][\s\S]*?\):focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--color-focus-ring\)/
    );
});

test("los controles deshabilitados conservan un estado común", () => {
    assert.match(
        styles,
        /:where\(button, input, select, textarea\):disabled\s*\{[\s\S]*?opacity:\s*var\(--disabled-opacity\)[\s\S]*?cursor:\s*not-allowed/
    );
});

test("la interfaz respeta la preferencia de movimiento reducido", () => {
    assert.match(
        styles,
        /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition-duration:\s*0\.01ms !important[\s\S]*?animation-duration:\s*0\.01ms !important/
    );
});
