import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { ColorSelector } from "../src/ui/ColorSelector.js";
import {
    SearchableMultiSelect
} from "../src/ui/SearchableMultiSelect.js";

const dialogSource = await readFile(
    new URL("../src/components/Dialog.js", import.meta.url),
    "utf8"
);
const colorSource = await readFile(
    new URL("../src/ui/ColorSelector.js", import.meta.url),
    "utf8"
);
const pickerSource = await readFile(
    new URL(
        "../src/ui/SearchableMultiSelect.js",
        import.meta.url
    ),
    "utf8"
);

test("los diálogos propios restauran el foco al control de origen", () => {
    assert.match(
        dialogSource,
        /const previousFocus = document\.activeElement;/
    );
    assert.match(
        dialogSource,
        /previousFocus\.isConnected/
    );
    assert.match(
        dialogSource,
        /previousFocus\.focus\(\)/
    );
    assert.ok(
        dialogSource.indexOf("dialog.remove();") <
        dialogSource.indexOf("previousFocus.focus();")
    );
});

test("la paleta de colores expone un grupo accesible", () => {
    const html = ColorSelector.render({
        id: "accessibilityColor",
        value: "#3b82f6"
    });

    assert.match(
        html,
        /class="colorSelectorPalette"\s+role="group"\s+aria-label="Paleta de colores"/
    );
});

test("el selector de color devuelve el foco al disparador al cerrarse explícitamente", () => {
    assert.match(
        colorSource,
        /const summary = panel\?\.querySelector\([\s\S]*?:scope > summary/
    );
    assert.match(
        colorSource,
        /if \(restoreFocus\) \{\s*summary\?\.focus\(\);\s*\}/
    );
    assert.match(
        colorSource,
        /dismissWithEscape[\s\S]*?cancel\(\{ restoreFocus: true \}\)/
    );
    assert.match(
        colorSource,
        /dismissFromOutside[\s\S]*?cancel\(\{ restoreFocus: false \}\)/
    );
});

test("los selectores múltiples anuncian cambios de cantidad y búsquedas vacías", () => {
    const html = new SearchableMultiSelect().render({
        id: "accessiblePicker",
        label: "Etiquetas",
        options: [{ value: "1", label: "Una" }],
        selectedValues: [],
        valueClass: "taskTag",
        emptyMessage: "Sin opciones"
    });

    assert.match(
        html,
        /id="accessiblePickerCount"\s+aria-live="polite"\s+aria-atomic="true"/
    );
    assert.match(
        html,
        /id="accessiblePickerNoMatches"[\s\S]*?role="status"[\s\S]*?aria-live="polite"/
    );
});

test("los selectores múltiples se pueden cerrar con Escape y restauran el foco", () => {
    assert.match(
        pickerSource,
        /manager\?\.addEventListener\([\s\S]*?"keydown"[\s\S]*?event\.key !== "Escape"/
    );
    assert.match(
        pickerSource,
        /event\.preventDefault\(\);[\s\S]*?closeManager\(\);/
    );
    assert.match(
        pickerSource,
        /manager\.querySelector\("summary"\)[\s\S]*?\.focus\(\)/
    );
});
