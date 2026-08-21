import test from "node:test";
import assert from "node:assert/strict";

import {
    buildAiTaskContext,
    getLocalDateIso
} from "../src/core/AiTaskContext.js";

test("getLocalDateIso usa los componentes de fecha local y no UTC", () => {
    const localDate = {
        getFullYear: () => 2026,
        getMonth: () => 7,
        getDate: () => 21,
        toISOString: () => "2026-08-22T01:30:00.000Z"
    };

    assert.equal(
        getLocalDateIso(localDate),
        "2026-08-21"
    );
});

test("buildAiTaskContext toma la fecha local como hoy por defecto", () => {
    const OriginalDate = globalThis.Date;

    class LocalBoundaryDate extends OriginalDate {
        constructor(...args) {
            super(...(
                args.length
                    ? args
                    : ["2026-08-22T01:30:00.000Z"]
            ));
        }

        getFullYear() {
            return 2026;
        }

        getMonth() {
            return 7;
        }

        getDate() {
            return 21;
        }
    }

    globalThis.Date = LocalBoundaryDate;

    try {
        const context = buildAiTaskContext({
            tasks: []
        });

        assert.equal(context.today, "2026-08-21");
    } finally {
        globalThis.Date = OriginalDate;
    }
});
