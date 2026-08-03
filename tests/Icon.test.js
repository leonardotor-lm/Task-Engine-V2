import test from "node:test";
import assert from "node:assert/strict";

import { Icon } from "../src/ui/Icon.js";

test("ofrece la familia inicial de íconos", () => {

    assert.deepEqual(
        Icon.names,
        [
            "back",
            "plus",
            "save",
            "edit",
            "eye",
            "eye-off",
            "more",
            "close",
            "chevron-down",
            "chevron-up",
            "chevron-right",
            "chevron-left",
            "corner-down-right",
            "clock",
        "repeat",
        "menu",
        "check",
        "search",
        "settings"
        ]
    );

});

test("usa trazados oficiales de la familia Lucide", () => {

    assert.match(
        Icon.render("edit"),
        /M21\.174 6\.812/
    );
    assert.match(
        Icon.render("repeat"),
        /M13 18H7/
    );

});

test("renderiza SVG decorativo con color heredado", () => {

    const html = Icon.render(
        "back",
        "headerIcon"
    );

    assert.match(html, /<svg/);
    assert.match(html, /class="icon headerIcon"/);
    assert.match(html, /stroke="currentColor"/);
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /focusable="false"/);

});

test("rechaza íconos fuera de la familia", () => {

    assert.throws(
        () => Icon.render("unknown"),
        {
            message: "Ícono desconocido: unknown"
        }
    );

});

test("escapa las clases adicionales", () => {

    const html = Icon.render(
        "plus",
        `icon" onclick="alert(1)`
    );

    assert.doesNotMatch(html, /onclick=/);
    assert.doesNotMatch(html, /alert/);

});
