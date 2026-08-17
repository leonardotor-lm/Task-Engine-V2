import test from "node:test";
import assert from "node:assert/strict";
import { Sidebar } from "../src/ui/Sidebar.js";
import { View } from "../src/core/View.js";

test("un proyecto abierto ofrece filtros rápidos y orden", () => {

    const sidebar = new Sidebar();

    const html = sidebar.render(
        View.PROJECT,
        "",
        [],
        null,
        [],
        [],
        {},
        "MANUAL"
    );

    assert.match(
        html,
        /id="openTaskTools"/
    );
    assert.match(
        html,
        /id="taskFilterForm"/
    );
    assert.match(
        html,
        /id="taskSort"/
    );
    assert.match(
        html,
        />\s*Orden manual\s*</
    );

});
