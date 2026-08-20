import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    RecurrenceFrequency,
    getNextRecurrenceDate,
    isBusinessMonthlyRecurrenceFrequency
} from "../src/domain/Recurrence.js";

test("calcula los primeros cinco días hábiles del mes siguiente", () => {

    const cases = [
        [
            RecurrenceFrequency.MONTHLY_BUSINESS_FIRST,
            "2026-09-01"
        ],
        [
            RecurrenceFrequency.MONTHLY_BUSINESS_SECOND,
            "2026-09-02"
        ],
        [
            RecurrenceFrequency.MONTHLY_BUSINESS_THIRD,
            "2026-09-03"
        ],
        [
            RecurrenceFrequency.MONTHLY_BUSINESS_FOURTH,
            "2026-09-04"
        ],
        [
            RecurrenceFrequency.MONTHLY_BUSINESS_FIFTH,
            "2026-09-07"
        ]
    ];

    for (const [frequency, expected] of cases) {
        assert.equal(
            getNextRecurrenceDate(
                "2026-08-03",
                frequency
            ),
            expected
        );
    }

});

test("calcula el último día hábil del mes siguiente", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-08-31",
            RecurrenceFrequency
                .MONTHLY_BUSINESS_LAST
        ),
        "2026-09-30"
    );

});

test("respeta intervalos de varios meses en reglas hábiles", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-08-03",
            RecurrenceFrequency
                .MONTHLY_BUSINESS_FIRST,
            { interval: 2 }
        ),
        "2026-10-01"
    );

});

test("considera hábiles sólo lunes a viernes", () => {

    assert.equal(
        getNextRecurrenceDate(
            "2026-04-01",
            RecurrenceFrequency
                .MONTHLY_BUSINESS_FIRST
        ),
        "2026-05-01"
    );

    assert.equal(
        getNextRecurrenceDate(
            "2026-05-01",
            RecurrenceFrequency
                .MONTHLY_BUSINESS_FIRST
        ),
        "2026-06-01"
    );

    assert.equal(
        getNextRecurrenceDate(
            "2026-07-01",
            RecurrenceFrequency
                .MONTHLY_BUSINESS_FIRST
        ),
        "2026-08-03"
    );

});

test("identifica únicamente las reglas mensuales hábiles", () => {

    assert.equal(
        isBusinessMonthlyRecurrenceFrequency(
            RecurrenceFrequency
                .MONTHLY_BUSINESS_FIRST
        ),
        true
    );

    assert.equal(
        isBusinessMonthlyRecurrenceFrequency(
            RecurrenceFrequency.MONTHLY
        ),
        false
    );

});

test("el controlador expone las opciones hábiles sin duplicar el editor", async () => {

    const controller = await readFile(
        new URL(
            "../src/ui/BusinessDayRecurrenceController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        controller,
        /Primer día hábil del mes/
    );
    assert.match(
        controller,
        /Quinto día hábil del mes/
    );
    assert.match(
        controller,
        /Último día hábil del mes/
    );
    assert.match(
        controller,
        /mes\(es\)/
    );

});
