export const TASK_GROUPING_PREFERENCES_STORAGE_KEY =
    "task-engine-v2-task-grouping-by-view-v1";

export const TaskGrouping = Object.freeze({
    NONE: "NONE",
    AREA: "AREA",
    CONTEXT: "CONTEXT",
    PROJECT: "PROJECT",
    DATE: "DATE"
});

const VALID_GROUPINGS = new Set(
    Object.values(TaskGrouping)
);

export class TaskGroupingPreferencesRepository {

    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
    }

    normalizeGrouping(grouping) {
        return VALID_GROUPINGS.has(grouping)
            ? grouping
            : TaskGrouping.NONE;
    }

    normalizePreferences(preferences) {
        if (
            !preferences ||
            typeof preferences !== "object" ||
            Array.isArray(preferences)
        ) {
            return {};
        }

        const normalized = {};

        for (const [viewKey, grouping] of Object.entries(preferences)) {
            if (
                typeof viewKey !== "string" ||
                !viewKey.trim() ||
                !VALID_GROUPINGS.has(grouping)
            ) {
                continue;
            }

            normalized[viewKey] = grouping;
        }

        return normalized;
    }

    getAll() {
        try {
            const raw = this.storage?.getItem?.(
                TASK_GROUPING_PREFERENCES_STORAGE_KEY
            );

            if (!raw) return {};

            return this.normalizePreferences(
                JSON.parse(raw)
            );
        } catch {
            return {};
        }
    }

    get(viewKey) {
        return this.normalizeGrouping(
            this.getAll()[viewKey]
        );
    }

    set(viewKey, grouping) {
        if (
            typeof viewKey !== "string" ||
            !viewKey.trim()
        ) {
            return TaskGrouping.NONE;
        }

        const normalizedGrouping =
            this.normalizeGrouping(grouping);

        this.replaceAll({
            ...this.getAll(),
            [viewKey]: normalizedGrouping
        });

        return normalizedGrouping;
    }

    replaceAll(preferences) {
        const normalized =
            this.normalizePreferences(preferences);

        try {
            this.storage?.setItem?.(
                TASK_GROUPING_PREFERENCES_STORAGE_KEY,
                JSON.stringify(normalized)
            );
        } catch {
            // Las preferencias visuales no deben impedir usar la aplicación.
        }

        return normalized;
    }
}
