import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const taskList = await readFile(
    new URL(
        "../src/ui/TaskList.js",
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

test("el menú móvil reúne las acciones principales", () => {

    assert.match(
        taskList,
        /mobileQuickMenuAction/
    );

    assert.match(
        taskList,
        /mobileQuickPostpone/
    );

    assert.match(
        taskList,
        />\s*Agregar subtarea\s*</
    );

});

test("las acciones móviles se presentan como panel táctil", () => {

    assert.match(
        styles,
        /Segunda etapa responsive/
    );

    assert.match(
        styles,
        /max-height: 72dvh/
    );

    assert.match(
        styles,
        /min-height: 42px/
    );

});
