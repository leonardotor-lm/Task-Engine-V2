import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const styles = await readFile(
    new URL(
        "../styles.css",
        import.meta.url
    ),
    "utf8"
);

test("los campos de las secciones se apilan en escritorio", () => {

    assert.match(
        styles,
        /\.editorSectionBody > label \{[\s\S]*?display: block/
    );

    assert.match(
        styles,
        /\.editorSectionBody > input,[\s\S]*?width: 100%/
    );

});

test("el encabezado conserva órdenes distintos según el ancho", () => {

    assert.match(
        styles,
        /@media \(min-width: 761px\)[\s\S]*?#closeTaskEditor[\s\S]*?order: 2/
    );

    assert.match(
        styles,
        /@media \(max-width: 760px\)[\s\S]*?\.mobileEditorSave[\s\S]*?order: 3/
    );

});
