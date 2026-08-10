import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const editor = await readFile(
    new URL(
        "../src/ui/TaskEditor.js",
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

const draft = await readFile(
    new URL(
        "../src/ui/TaskEditorDraft.js",
        import.meta.url
    ),
    "utf8"
);

test("el editor ofrece intervalo y días semanales", () => {

    assert.match(
        editor,
        /id="taskRecurrenceInterval"/
    );

    assert.match(
        editor,
        /class="taskRecurrenceWeekday"/
    );

    assert.match(
        editor,
        /Días de la semana/
    );

});

test("el diálogo de recurrencia ofrece acciones visibles y cancelación reversible", async () => {

    const desktopStyles = await readFile(
        new URL(
            "../styles/task-editor-desktop.css",
            import.meta.url
        ),
        "utf8"
    );
    const mobileStyles = await readFile(
        new URL(
            "../styles/task-editor-mobile.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(editor, /id="saveRecurrence"/);
    assert.match(editor, /id="cancelRecurrence"/);
    assert.match(
        mainView,
        /"saveRecurrence"[\s\S]*?"saveTask"/
    );
    assert.match(
        mainView,
        /"cancelRecurrence"[\s\S]*?selectedTask\.recurrence/
    );
    assert.match(
        desktopStyles,
        /\.recurrenceDialogActions\s*\{[\s\S]*?position:\s*sticky;/
    );
    assert.match(
        mobileStyles,
        /\.recurrenceDialogActions\s*\{[\s\S]*?position:\s*sticky;/
    );

});

test("los controles cambian según la frecuencia", () => {

    assert.match(
        mainView,
        /updateRecurrenceControls/
    );

    assert.match(
        mainView,
        /frequency !==\s*"WEEKLY"/
    );

    assert.match(
        mainView,
        /recurrenceInterval/
    );

    assert.match(
        mainView,
        /recurrenceWeekdays/
    );

});

test("el detector de cambios incluye la regla avanzada", () => {

    assert.match(
        draft,
        /recurrenceInterval/
    );

    assert.match(
        draft,
        /recurrenceWeekdays/
    );

});
