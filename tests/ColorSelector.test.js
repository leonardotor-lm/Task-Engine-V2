import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { ColorSelector } from "../src/ui/ColorSelector.js";

const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);
const source = await readFile(
    new URL("../src/ui/ColorSelector.js", import.meta.url),
    "utf8"
);

test("ofrece una paleta común y un color hexadecimal personalizado", () => {
    const html = ColorSelector.render({
        id: "testColor",
        value: "#22C55E",
        inputClass: "savedColor"
    });

    assert.match(html, /id="testColor"/);
    assert.match(html, /class="savedColor"/);
    assert.match(html, /value="#22c55e"/);
    assert.match(html, /class="colorSelectorPalette"/);
    assert.match(html, /class="colorSelectorNative"/);
    assert.match(html, /type="color"/);
    assert.match(html, /class="colorSelectorHex"/);
    assert.match(html, /class="colorSelectorCancel tertiaryAction"/);
    assert.match(html, /class="colorSelectorApply primaryAction"/);
    assert.match(html, /#3b82f6/);
    assert.match(html, /#fca5a5/);
});

test("normaliza colores válidos y rechaza valores inválidos", () => {
    assert.equal(
        ColorSelector.normalize(" #A855F7 "),
        "#a855f7"
    );
    assert.equal(
        ColorSelector.normalize("rojo", ""),
        ""
    );
    assert.equal(
        ColorSelector.normalize("#fff", ""),
        ""
    );
});

test("recuerda hasta doce colores personalizados", () => {
    const values = new Map();
    const previousStorage = globalThis.localStorage;

    globalThis.localStorage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value)
    };

    try {
        for (let index = 0; index < 14; index += 1) {
            ColorSelector.remember(
                `#${(index + 16).toString(16).padStart(6, "0")}`
            );
        }

        assert.equal(
            ColorSelector.recentColors().length,
            12
        );
    } finally {
        if (previousStorage === undefined) {
            delete globalThis.localStorage;
        } else {
            globalThis.localStorage = previousStorage;
        }
    }
});

test("el selector conserva geometría propia y adaptación móvil", () => {
    assert.match(
        styles,
        /\.colorSelectorPanel > summary[\s\S]*?border-radius:\s*0;/
    );
    assert.match(styles, /\.colorSelectorContent[\s\S]*?z-index:\s*25;/);
    assert.match(
        styles,
        /@media \(max-width: 760px\)[\s\S]*?\.colorSelectorPanel > summary[\s\S]*?min-height:\s*44px;/
    );
});

test("cancelar escape y clic exterior descartan la selección provisoria", () => {
    assert.match(source, /const cancel = \(\{/);
    assert.match(source, /select\(committedColor\)/);
    assert.match(source, /event\.key !== "Escape"/);
    assert.match(source, /"pointerdown"/);
    assert.match(source, /colorSelectorCancel/);
    assert.match(source, /colorSelectorApply/);
});
