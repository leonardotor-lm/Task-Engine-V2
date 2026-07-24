import test from "node:test";
import assert from "node:assert/strict";

import {
    RecurrenceFrequency,
    getNextRecurrenceDate
} from "../src/domain/Recurrence.js";

test("calcula la siguiente fecha diaria", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-24",
            RecurrenceFrequency.DAILY
        ),
        "2026-07-25"
    );

});

test("calcula la siguiente fecha semanal", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-24",
            RecurrenceFrequency.WEEKLY
        ),
        "2026-07-31"
    );

});

test("ajusta una recurrencia mensual al último día disponible", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-01-31",
            RecurrenceFrequency.MONTHLY
        ),
        "2026-02-28"
    );

    assert.equal(
        getNextRecurrenceDate(
            "2028-01-31",
            RecurrenceFrequency.MONTHLY
        ),
        "2028-02-29"
    );

});

test("cambia de año en una recurrencia mensual", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-12-31",
            RecurrenceFrequency.MONTHLY
        ),
        "2027-01-31"
    );

});

test("rechaza una recurrencia sin fecha", () => {

    assert.throws(
        () => getNextRecurrenceDate(
            null,
            RecurrenceFrequency.DAILY
        ),
        {
            message: "La recurrencia necesita una fecha de vencimiento."
        }
    );

});
