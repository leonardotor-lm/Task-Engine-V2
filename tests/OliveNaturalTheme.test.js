import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    TaskDisplayPreferences
} from "../src/infrastructure/TaskDisplayPreferences.js";

class MemoryStorage {

    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.get(key) ?? null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }

}

test("persiste el tema Oliva", () => {

    const storage = new MemoryStorage();
    const preferences =
        new TaskDisplayPreferences(storage);

    assert.equal(
        preferences.setTheme("olive-natural"),
        "olive-natural"
    );
    assert.equal(
        new TaskDisplayPreferences(storage)
            .getTheme(),
        "olive-natural"
    );

});

test("Oliva aparece en el selector de apariencia", async () => {

    const source = await readFile(
        new URL("../src/ui/ThemeController.js", import.meta.url),
        "utf8"
    );

    assert.match(source, /id:\s*"olive-natural"/);
    assert.match(source, /label:\s*"Oliva"/);

});

test("Oliva define una identidad vegetal diferenciada sin cambiar tipografía ni geometría", async () => {

    const theme = await readFile(
        new URL(
            "../styles/themes/olive-natural.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(theme, /:root\[data-theme="olive-natural"\]/);
    assert.match(theme, /--color-surface:\s*#f1f0e6/);
    assert.match(theme, /--color-surface-subtle:\s*#dde0d2/);
    assert.match(theme, /--color-text:\s*#30352d/);
    assert.match(theme, /--color-accent:\s*#59633f/);
    assert.match(theme, /--color-accent-muted:\s*#aab59a/);
    assert.match(theme, /--color-danger:\s*#a65f49/);
    assert.match(
        theme,
        /\.sidebar\s*\{[\s\S]*?background:\s*#72785b;/
    );

    assert.doesNotMatch(theme, /(^|[;{]\s*)font-family\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)font-size\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)line-height\s*:/m);
    assert.doesNotMatch(theme, /(^|[;{]\s*)border-radius\s*:/m);
}
);