import { TaskSort } from "../core/TaskSorting.js";

export const TASK_SORT_PREFERENCES_STORAGE_KEY =
    "task-engine-v2-task-sort-by-view-v1";

const VALID_SORTS = new Set(
    Object.values(TaskSort)
);

export class TaskSortPreferencesRepository {

    constructor(
        storage = globalThis.localStorage
    ) {

        this.storage = storage;

    }

    normalizeSort(sort) {

        return VALID_SORTS.has(sort)
            ? sort
            : TaskSort.MANUAL;

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

        for (
            const [viewKey, sort] of
            Object.entries(preferences)
        ) {

            if (
                typeof viewKey !== "string" ||
                !viewKey.trim() ||
                !VALID_SORTS.has(sort)
            ) {
                continue;
            }

            normalized[viewKey] = sort;

        }

        return normalized;

    }

    getAll() {

        try {

            const raw = this.storage?.getItem?.(
                TASK_SORT_PREFERENCES_STORAGE_KEY
            );

            if (!raw) {
                return {};
            }

            return this.normalizePreferences(
                JSON.parse(raw)
            );

        } catch {
            return {};
        }

    }

    get(viewKey) {

        return this.normalizeSort(
            this.getAll()[viewKey]
        );

    }

    set(viewKey, sort) {

        if (
            typeof viewKey !== "string" ||
            !viewKey.trim()
        ) {
            return TaskSort.MANUAL;
        }

        const normalizedSort =
            this.normalizeSort(sort);

        this.replaceAll({
            ...this.getAll(),
            [viewKey]: normalizedSort
        });

        return normalizedSort;

    }

    replaceAll(
        preferences,
        { throwOnError = false } = {}
    ) {

        const normalized =
            this.normalizePreferences(preferences);

        try {

            this.storage?.setItem?.(
                TASK_SORT_PREFERENCES_STORAGE_KEY,
                JSON.stringify(normalized)
            );

        } catch (error) {
            if (throwOnError) {
                throw error;
            }
            // Las preferencias no deben impedir usar la aplicación.
        }

        return normalized;

    }

}
