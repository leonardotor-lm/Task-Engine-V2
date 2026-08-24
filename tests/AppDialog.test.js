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

test("renderiza una solicitud de texto con la estética propia", () => {
    const html = Dialog.render({
        id: "dialog-prompt",
        title: "Guardar filtro",
        message: "Elegí un nombre.",
        confirmLabel: "Guardar",
        cancelLabel: "Cancelar",
        variant: "prompt",
        input: true,
        inputLabel: "Nombre del filtro",
        defaultValue: "<Hoy>"
    });

    assert.match(html, /data-dialog-input/);
    assert.match(html, /Nombre del filtro/);
    assert.match(html, /value="&lt;Hoy&gt;"/);
    assert.doesNotMatch(html, /value="<Hoy>"/);
});

test("renderiza decisiones con más de dos alternativas", () => {
    const html = Dialog.render({
        id: "dialog-choice",
        title: "Etiqueta en uso",
        message: "Elegí qué hacer.",
        cancelLabel: "Cancelar",
        choices: [
            {
                value: "review",
                label: "Ver tareas",
                variant: "primary"
            },
            {
                value: "delete",
                label: "Eliminar y desafectar",
                variant: "danger"
            }
        ]
    });

    assert.match(
        html,
        /data-dialog-value="review"/
    );
    assert.match(
        html,
        /data-dialog-value="delete"/
    );
    assert.match(html, /Eliminar y desafectar/);
    assert.doesNotMatch(
        html,
        /data-dialog-action="confirm"/
    );
});

test("las confirmaciones restantes usan el diálogo propio", () => {
    assert.doesNotMatch(
        mainViewSource,
        /Dialog\.(?:confirm|prompt)\(/
    );

    for (const id of [
        "clearSyncConfig",
        "pushToCloud",
        "pullFromCloud",
        "overwriteCloud",
        "importBackup",
        "restoreLastImportBackup",
        "saveCustomFilter",
        "bulkRestoreTasks",
        "bulkCompleteTasks",
        "bulkArchiveTasks",
        "bulkDeleteTasks"
    ]) {
        const start = mainViewSource.indexOf(`"${id}"`);
        const block = mainViewSource.slice(start, start + 1400);

        assert.notEqual(start, -1);
        assert.match(
            block,
            id === "saveCustomFilter"
                ? /Dialog\.promptAsync\(/
                : /Dialog\.confirmAsync\(/
        );
    }
});

test("las eliminaciones masivas definitivas exigen confirmación doble", () => {
    for (const id of [
        "bulkPermanentlyDeleteTasks",
        "emptyTrash"
    ]) {
        const start = mainViewSource.indexOf(`"${id}"`);
        const nextAction = mainViewSource.indexOf(
            "document.getElementById(",
            start + 30
        );
        const block = mainViewSource.slice(
            start,
            nextAction === -1 ? start + 1900 : nextAction
        );

        assert.equal(
            block.match(/Dialog\.confirmAsync\(/g)?.length,
            2
        );
        assert.match(block, /Confirmación final/);
    }
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
    assert.ok(
        deletionBlock.indexOf("config.isInUse") <
        deletionBlock.indexOf("Dialog.confirmAsync")
    );
    assert.match(
        deletionBlock,
        /Dialog\.alert\([\s\S]*?está asignado a una o más tareas/
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

test("las acciones rápidas de tareas usan diálogos propios", () => {
    for (const className of [
        "quickDuplicateTask",
        "quickSkipRecurringTask",
        "quickEndRecurrence",
        "quickArchiveTask",
        "quickDeleteTask"
    ]) {
        const start = mainViewSource.indexOf(
            `".${className}"`
        );
        const nextAction = mainViewSource.indexOf(
            "document.querySelectorAll(",
            start + 30
        );
        const block = mainViewSource.slice(
            start,
            nextAction
        );

        assert.notEqual(start, -1);
        assert.match(block, /Dialog\.confirmAsync\(/);
        assert.doesNotMatch(block, /Dialog\.confirm\(/);
    }
});

test("las acciones del editor de tareas usan diálogos propios", () => {
    for (const id of [
        "skipRecurringTask",
        "archiveTask",
        "deleteTask",
        "moveTaskFromEditor"
    ]) {
        const start = mainViewSource.indexOf(
            `"${id}"`
        );
        const nextAction = mainViewSource.indexOf(
            "document.getElementById(",
            start + 30
        );
        const block = mainViewSource.slice(
            start,
            nextAction
        );

        assert.notEqual(start, -1);
        assert.match(block, /Dialog\.confirmAsync\(/);
        assert.doesNotMatch(block, /Dialog\.confirm\(/);
    }
});

test("el borrado definitivo de tareas exige dos confirmaciones propias", () => {
    const start = mainViewSource.indexOf(
        '"permanentlyDeleteTask"'
    );
    const nextAction = mainViewSource.indexOf(
        "document.getElementById(",
        start + 30
    );
    const block = mainViewSource.slice(
        start,
        nextAction
    );

    assert.equal(
        block.match(/Dialog\.confirmAsync\(/g)?.length,
        2
    );
    assert.match(block, /Confirmación final/);
    assert.doesNotMatch(block, /Dialog\.confirm\(/);
});
