import test from "node:test";
import assert from "node:assert/strict";

import { escapeHtml } from "../src/ui/escapeHtml.js";

test("escapa caracteres especiales de HTML", () => {

    const result = escapeHtml(
        `<script>alert("prueba")</script>`
    );

    assert.equal(
        result,
        "&lt;script&gt;alert(&quot;prueba&quot;)&lt;/script&gt;"
    );

});

test("escapa comillas simples y ampersand", () => {

    const result = escapeHtml(
        "Lengua & Literatura 'Argentina'"
    );

    assert.equal(
        result,
        "Lengua &amp; Literatura &#039;Argentina&#039;"
    );

});

test("convierte valores nulos en texto vacío", () => {

    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");

});