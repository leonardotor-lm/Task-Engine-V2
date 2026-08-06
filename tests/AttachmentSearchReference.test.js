import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    ATTACHMENT_SEARCH_REFERENCE_HTML
} from "../src/ui/AttachmentSearchReference.js";

const mainSource = await readFile(
    new URL("../src/main.js", import.meta.url),
    "utf8"
);
const guide = await readFile(
    new URL("../docs/BUSQUEDA_AVANZADA.md", import.meta.url),
    "utf8"
);

test("muestra y documenta los criterios de búsqueda por adjuntos", () => {

    assert.match(
        ATTACHMENT_SEARCH_REFERENCE_HTML,
        /tieneAdjuntos/
    );
    assert.match(
        ATTACHMENT_SEARCH_REFERENCE_HTML,
        /adjunto/
    );
    assert.match(
        mainSource,
        /bindAttachmentSearchReference\(app\)/
    );
    assert.match(
        guide,
        /## Adjuntos/
    );
    assert.match(
        guide,
        /adjuntoContiene/
    );
    assert.doesNotMatch(
        guide,
        /La aplicación aún no permite agregar adjuntos/
    );

});
