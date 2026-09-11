import {
    DEFAULT_TASK_REVIEW_RULES
} from "../core/TaskReviewSignals.js";

const STORAGE_KEY = "task-engine-v2-task-review-rules";

function positiveInteger(value, fallback) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0
        ? parsed
        : fallback;
}

function normalizeBoolean(value, fallback) {
    return typeof value === "boolean"
        ? value
        : fallback;
}

export function normalizeTaskReviewRules(value = {}) {
    return {
        staleUnscheduled: {
            enabled: normalizeBoolean(
                value?.staleUnscheduled?.enabled,
                DEFAULT_TASK_REVIEW_RULES.staleUnscheduled.enabled
            ),
            days: positiveInteger(
                value?.staleUnscheduled?.days,
                DEFAULT_TASK_REVIEW_RULES.staleUnscheduled.days
            )
        },
        overdue: {
            enabled: normalizeBoolean(
                value?.overdue?.enabled,
                DEFAULT_TASK_REVIEW_RULES.overdue.enabled
            ),
            days: positiveInteger(
                value?.overdue?.days,
                DEFAULT_TASK_REVIEW_RULES.overdue.days
            )
        },
        repeatedPostponements: {
            enabled: normalizeBoolean(
                value?.repeatedPostponements?.enabled,
                DEFAULT_TASK_REVIEW_RULES.repeatedPostponements.enabled
            ),
            count: positiveInteger(
                value?.repeatedPostponements?.count,
                DEFAULT_TASK_REVIEW_RULES.repeatedPostponements.count
            )
        },
        unplannedProcessed: {
            enabled: normalizeBoolean(
                value?.unplannedProcessed?.enabled,
                DEFAULT_TASK_REVIEW_RULES.unplannedProcessed.enabled
            )
        }
    };
}

export class TaskReviewPreferences {
    constructor(storage = localStorage) {
        this.storage = storage;
    }

    get() {
        const raw = this.storage.getItem(STORAGE_KEY);
        if (!raw) return normalizeTaskReviewRules();

        try {
            return normalizeTaskReviewRules(JSON.parse(raw));
        } catch {
            return normalizeTaskReviewRules();
        }
    }

    save(value) {
        const normalized = normalizeTaskReviewRules(value);
        this.storage.setItem(
            STORAGE_KEY,
            JSON.stringify(normalized)
        );
        return normalized;
    }

    reset() {
        this.storage.removeItem(STORAGE_KEY);
        return this.get();
    }
}
