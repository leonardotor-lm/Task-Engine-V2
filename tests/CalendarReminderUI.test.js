import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("agrupa recurrencia y recordatorios bajo Programación", async () => {

    const source = await readFile(
        new URL(
            "../src/ui/CalendarReminderController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /summary\.textContent\s*=\s*"Programación"/
    );
    assert.match(
        source,
        />\s*Recordatorio\s*</
    );

});

test("las tareas con recordatorio reciben un indicador amarillo en metadatos", async () => {

    const source = await readFile(
        new URL(
            "../src/ui/CalendarReminderController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /taskReminderIndicator/
    );
    assert.match(
        source,
        /var\(--color-warning\)/
    );
    assert.match(
        source,
        /taskReminderIcon/
    );
    assert.match(
        source,
        /getAllTasks/
    );

});
