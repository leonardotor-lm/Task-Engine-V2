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
