import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("main conecta el controlador de organización con IA", () => {
    const source = fs.readFileSync(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );

    assert.match(
        source,
        /AiOrganizationProposalController/
    );
    assert.match(
        source,
        /aiOrganizationProposalController\.start\(\);/
    );
});

test("la PWA incluye el controlador de organización con IA", () => {
    const source = fs.readFileSync(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(
        source,
        /\.\/src\/ui\/AiOrganizationProposalController\.js/
    );
});

test("la propuesta no permite borrar etiquetas", () => {
    const source = fs.readFileSync(
        new URL(
            "../src/ui/AiOrganizationProposalController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(source, /addTagIds/);
    assert.doesNotMatch(source, /removeTagIds/);
    assert.match(
        source,
        /Las etiquetas sólo se agregan; nunca se quitan automáticamente/
    );
});
