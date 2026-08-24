const STORAGE_KEY =
    "task-engine-v2-task-filter-preferences-v1";

export const EMPTY_TASK_FILTERS =
    Object.freeze({
        areaId: "",
        contextId: "",
        tagId: "",
        priority: "",
        due: ""
    });

const FILTER_KEYS =
    Object.keys(EMPTY_TASK_FILTERS);

export class TaskFilterPreferencesRepository {

    constructor(storage = globalThis.localStorage) {

        this.storage = storage;
        this.preferences = {};
        this.load();

    }

    normalizeFilters(filters = {}) {

        const normalized = {};

        for (const key of FILTER_KEYS) {
            normalized[key] =
                filters?.[key] === null ||
                filters?.[key] === undefined
                    ? ""
                    : String(filters[key]);
        }

        return normalized;

    }

    normalizeAll(preferences = {}) {

        if (
            !preferences ||
            typeof preferences !== "object" ||
            Array.isArray(preferences)
        ) {
            return {};
        }

        const normalized = {};

        for (
            const [viewKey, filters] of
            Object.entries(preferences)
        ) {

            if (
                typeof viewKey !== "string" ||
                !viewKey.trim() ||
                !filters ||
                typeof filters !== "object" ||
                Array.isArray(filters)
            ) {
                continue;
            }

            normalized[viewKey] =
                this.normalizeFilters(filters);

        }

        return normalized;

    }

    load() {

        const json =
            this.storage?.getItem(STORAGE_KEY);

        if (!json) return;

        try {
            this.preferences =
                this.normalizeAll(JSON.parse(json));
        } catch {
            this.preferences = {};
        }

    }

    save() {

        this.storage?.setItem(
            STORAGE_KEY,
            JSON.stringify(this.preferences)
        );

    }

    get(viewKey) {

        return this.normalizeFilters(
            this.preferences[viewKey] ??
            EMPTY_TASK_FILTERS
        );

    }

    getAll() {

        return this.normalizeAll(
            this.preferences
        );

    }

    set(viewKey, filters) {

        if (
            typeof viewKey !== "string" ||
            !viewKey.trim()
        ) {
            return this.normalizeFilters();
        }

        const normalized =
            this.normalizeFilters(filters);

        this.replaceAll({
            ...this.preferences,
            [viewKey]: normalized
        });

        return { ...normalized };

    }

    replaceAll(preferences) {

        const previous = this.preferences;
        this.preferences =
            this.normalizeAll(preferences);

        try {
            this.save();
        } catch (error) {
            this.preferences = previous;
            throw error;
        }

    }

}
