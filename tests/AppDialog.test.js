import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Dialog } from "../src/components/Dialog.js";

const mainViewSource = await readFile(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);
const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("renderiza un diálogo propio y escapa su contenido", () => {
    const html = Dialog.render({
        id: "dialog-1",
        title: "Eliminar <área>",
        message: "¿Eliminar <script>?",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        variant: "danger"
    });

    assert.match(html, /class="appDialog appDialog--danger"/);
    assert.match(html, /Eliminar &lt;área&gt;/);
    assert.match(html, /¿Eliminar &lt;script&gt;\?/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /data-dialog-action="confirm"/);
    assert.match(html, /data-dialog-action="cancel"/);
});

test("las eliminaciones de organización usan confirmación propia", () => {
    const deletionStart = mainViewSource.indexOf(
        'document.querySelectorAll(".deleteEntity")'
    );
    const deletionEnd = mainViewSource.indexOf(
        '".moveEntity"',
        deletionStart
    );
    const deletionBlock = mainViewSource.slice(
        deletionStart,
        deletionEnd
    );

    assert.match(
        deletionBlock,
        /Dialog\.confirmAsync\([\s\S]*?variant:\s*"danger"/
    );
    assert.equal(
        deletionBlock.match(
            /Dialog\.confirmAsync\(/g
        )?.length,
        2
    );
    assert.match(
        deletionBlock,
        /no puede deshacerse/
    );
    assert.match(
        deletionBlock,
        /Eliminar definitivamente/
    );
});

test("el diálogo comparte geometría y adaptación móvil", () => {
    assert.match(styles, /\.appDialog\s*\{[\s\S]*?border-radius:\s*0;/);
    assert.match(styles, /\.appDialog::backdrop/);
    assert.match(
        styles,
        /@media \(max-width: 760px\)[\s\S]*?\.appDialogActions[\s\S]*?flex-direction:\s*column-reverse;/
    );
});

test("las acciones de objetivos usan diálogos propios", () => {
    for (const id of [
        "completeGoal",
        "archiveGoal",
        "deleteGoalFromEditor"
    ]) {
        const start = mainViewSource.indexOf(
            `"${id}"`
        );
        const block = mainViewSource.slice(
            start,
            start + 900
        );

        assert.match(block, /Dialog\.confirmAsync\(/);
        assert.doesNotMatch(block, /Dialog\.confirm\(/);
    }
});

test("el borrado definitivo de objetivos exige dos confirmaciones", () => {
    const start = mainViewSource.indexOf(
        'className ===\n                                    "permanentlyDeleteGoal"'
    );
    const block = mainViewSource.slice(
        start,
        start + 1800
    );

    assert.equal(
        block.match(/Dialog\.confirmAsync\(/g)?.length,
        2
    );
    assert.match(block, /no puede deshacerse/);
});
