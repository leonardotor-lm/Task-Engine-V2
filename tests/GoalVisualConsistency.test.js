import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("Objetivos mantiene títulos transparentes bajo temas que estilizan botones", () => {

    assert.match(
        styles,
        /:root \.goalsView \.openGoal\s*\{[\s\S]*?background:\s*transparent;[\s\S]*?color:\s*var\(--color-text\);[\s\S]*?box-shadow:\s*none;/
    );
    assert.match(
        styles,
        /:root \.goalsView \.openGoal:hover,[\s\S]*?background:\s*transparent;/
    );

});

test("Objetivos diferencia navegación y acción principal con tokens semánticos", () => {

    assert.match(
        styles,
        /:root \.goalsView \.goalStatusNavigation button\s*\{[\s\S]*?background:\s*transparent;[\s\S]*?color:\s*var\(--color-text-secondary\);/
    );
    assert.match(
        styles,
        /:root \.goalsView \.goalStatusNavigation button\.active\s*\{[\s\S]*?background:\s*var\(--color-accent-soft\);/
    );
    assert.match(
        styles,
        /:root \.goalsView \.createActionButton\s*\{[\s\S]*?background:\s*var\(--color-accent\);[\s\S]*?color:\s*var\(--color-on-accent\);/
    );

});
