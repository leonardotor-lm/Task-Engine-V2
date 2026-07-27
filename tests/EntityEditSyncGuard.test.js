import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(
    new URL(
        "../src/core/App.js",
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

test("la edición de entidades se detecta como estado transitorio", () => {

    assert.match(
        mainView,
        /hasActiveEntityEdit\(\)/
    );

    assert.match(
        mainView,
        /\.entityEditForm:not\(\[hidden\]\)/
    );

});

test("recuperar el foco no renderiza durante la edición", () => {

    assert.match(
        app,
        /hasActiveEntityEdit\(\)/
    );

    assert.match(
        app,
        /if \(\s*this\.mainView/
    );

});
