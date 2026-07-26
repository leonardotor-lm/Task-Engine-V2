import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const editor = await readFile(
    new URL(
        "../src/ui/TaskEditor.js",
        import.meta.url
    ),
    "utf8"
);

const mainView = await readFile(
    new URL(
        "../src/ui/MainView.js",
        import.meta.url
    ),
    "utf8"
);

const styles = await readFile(
    new URL(
        "../styles.css",
        import.meta.url
    ),
    "utf8"
);

test("el editor móvil ofrece guardar en el encabezado", () => {

    assert.match(
        editor,
        /id="saveTaskMobile"/
    );

    assert.match(
        editor,
        /class="mobileBackSymbol"/
    );

    assert.match(
        mainView,
        /"saveTaskMobile"/
    );

});

test("el editor móvil conserva controles táctiles amplios", () => {

    assert.match(
        styles,
        /Primera etapa responsive: editor móvil/
    );

    assert.match(
        styles,
        /min-height: 44px/
    );

    assert.match(
        styles,
        /\.taskEditorActions #saveTask/
    );

});
