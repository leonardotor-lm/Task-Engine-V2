import test from "node:test";
import assert from "node:assert/strict";
import {
    TaskReviewPreferences,
    normalizeTaskReviewRules
} from "../src/infrastructure/TaskReviewPreferences.js";

function createStorage() {
    const values = new Map();
    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        }
    };
}

test("usa reglas predeterminadas cuando no hay preferencias guardadas", () => {
    const preferences = new TaskReviewPreferences(createStorage());
    const rules = preferences.get();

    assert.equal(rules.staleUnscheduled.enabled, true);
    assert.equal(rules.staleUnscheduled.days, 30);
    assert.equal(rules.overdue.days, 1);
    assert.equal(rules.repeatedPostponements.count, 3);
    assert.equal(rules.unplannedProcessed.enabled, true);
});

test("guarda reglas desactivadas y umbrales personalizados", () => {
    const storage = createStorage();
    const preferences = new TaskReviewPreferences(storage);

    preferences.save({
        staleUnscheduled: { enabled: false, days: 45 },
        overdue: { enabled: true, days: 2 },
        repeatedPostponements: { enabled: false, count: 5 },
        unplannedProcessed: { enabled: false }
    });

    assert.deepEqual(preferences.get(), {
        staleUnscheduled: { enabled: false, days: 45 },
        overdue: { enabled: true, days: 2 },
        repeatedPostponements: { enabled: false, count: 5 },
        unplannedProcessed: { enabled: false }
    });
});

test("normaliza valores inválidos sin perder los booleanos válidos", () => {
    const rules = normalizeTaskReviewRules({
        staleUnscheduled: { enabled: false, days: 0 },
        repeatedPostponements: { count: "x" }
    });

    assert.equal(rules.staleUnscheduled.enabled, false);
    assert.equal(rules.staleUnscheduled.days, 30);
    assert.equal(rules.repeatedPostponements.count, 3);
});
