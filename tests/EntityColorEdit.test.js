import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manager = await readFile(
    new URL(
        "../src/ui/EntityManager.js",
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

test("guardar una entidad requiere una acción explícita", () => {

    assert.match(
        manager,
        /class="saveEntityEdit"/
    );

    assert.doesNotMatch(
        manager,
        /<button type="submit">\s*Guardar/
    );

    assert.match(
        mainView,
        /"\.saveEntityEdit"/
    );

});

test("el envío implícito del formulario se cancela", () => {

    assert.match(
        mainView,
        /form\.addEventListener\(\s*"submit"/
    );

    assert.match(
        mainView,
        /event\.preventDefault\(\)/
    );

});
