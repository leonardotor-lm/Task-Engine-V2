import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TaskDisplayPreferences } from "../src/infrastructure/TaskDisplayPreferences.js";

const themeController = await readFile(
    new URL("../src/ui/ThemeController.js", import.meta.url),
    "utf8"
);
const terminalCss = await readFile(
    new URL("../styles/themes/terminal-80.css", import.meta.url),
    "utf8"
);
const matrixCss = await readFile(
    new URL("../styles/themes/matrix.css", import.meta.url),
    "utf8"
);

function createStorage() {
    const values = new Map();
    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };
}

test("Matrix está disponible como tema independiente", () => {
    assert.match(themeController, /id:\s*"matrix"/);
    assert.match(themeController, /label:\s*"Matrix"/);
    assert.match(terminalCss, /@import url\("\.\/matrix\.css"\)/);
});

test("Matrix conserva la base terminal y refuerza la estética verde", () => {
    assert.match(matrixCss, /:root\[data-theme="matrix"\]/);
    assert.match(matrixCss, /--color-surface-subtle:\s*#010302/);
    assert.match(matrixCss, /--color-accent:\s*#00ff41/);
    assert.match(matrixCss, /family=Share\+Tech\+Mono/);
    assert.match(matrixCss, /--ui-font:\s*"Share Tech Mono"/);
    assert.match(matrixCss, /repeating-linear-gradient/);
    assert.match(matrixCss, /text-shadow:/);
});

test("Matrix se guarda y recupera como preferencia válida", () => {
    const preferences = new TaskDisplayPreferences(createStorage());
    assert.equal(preferences.setTheme("matrix"), "matrix");
    assert.equal(preferences.getTheme(), "matrix");
});
