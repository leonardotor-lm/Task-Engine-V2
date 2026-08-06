import { TaskSort } from "../core/TaskSorting.js";
import { View } from "../core/View.js";

const STORAGE_KEY =
    "task-engine-v2-task-sort-by-view-v1";

const VALID_SORTS = new Set(
    Object.values(TaskSort)
);

export function getTaskSortViewKey(app) {

    if (app.currentCustomFilterId) {
        return `custom-filter:${app.currentCustomFilterId}`;
    }

    if (app.advancedSearchMode) {
        return "advanced-search";
    }

    switch (app.currentView) {

        case View.AREA:
            return `area:${app.currentAreaId ?? "none"}`;

        case View.PROJECT:
            return `project:${app.projectTaskId ?? "none"}`;

        case View.GOAL:
            return `goal:${app.selectedGoal?.id ?? "none"}`;

        default:
            return `view:${app.currentView ?? View.TODAY}`;

    }

}

export class TaskSortPreferencesController {

    constructor(
        app,
        {
            storage = globalThis.localStorage
        } = {}
    ) {

        this.app = app;
        this.storage = storage;
        this.lastViewKey = null;
        this.started = false;

    }

    start() {

        if (this.started || !this.app) {
            return;
        }

        this.started = true;
        this.wrapSortCallback();
        this.wrapRender();

    }

    normalizeSort(sort) {

        return VALID_SORTS.has(sort)
            ? sort
            : TaskSort.MANUAL;

    }

    readPreferences() {

        try {

            const raw = this.storage?.getItem?.(
                STORAGE_KEY
            );

            if (!raw) {
                return {};
            }

            const parsed = JSON.parse(raw);

            if (
                !parsed ||
                typeof parsed !== "object" ||
                Array.isArray(parsed)
            ) {
                return {};
            }

            return parsed;

        } catch {
            return {};
        }

    }

    readSort(viewKey) {

        const preferences =
            this.readPreferences();

        return this.normalizeSort(
            preferences[viewKey]
        );

    }

    writeSort(viewKey, sort) {

        if (!viewKey) {
            return;
        }

        const normalized =
            this.normalizeSort(sort);
        const preferences = {
            ...this.readPreferences(),
            [viewKey]: normalized
        };

        try {

            this.storage?.setItem?.(
                STORAGE_KEY,
                JSON.stringify(preferences)
            );

        } catch {
            // La preferencia no debe impedir ordenar la lista.
        }

    }

    getViewKey() {

        return getTaskSortViewKey(this.app);

    }

    wrapSortCallback() {

        const callbacks =
            this.app.mainView?.callbacks;
        const originalChangeSort =
            callbacks?.onChangeTaskSort;

        if (
            !callbacks ||
            typeof originalChangeSort !== "function"
        ) {
            return;
        }

        callbacks.onChangeTaskSort = sort => {

            const normalized =
                this.normalizeSort(sort);

            this.writeSort(
                this.getViewKey(),
                normalized
            );

            return originalChangeSort(normalized);

        };

    }

    wrapRender() {

        if (typeof this.app.render !== "function") {
            return;
        }

        const originalRender =
            this.app.render.bind(this.app);

        this.app.render = (...args) => {

            const viewKey = this.getViewKey();

            if (viewKey !== this.lastViewKey) {
                this.app.taskSort =
                    this.readSort(viewKey);
                this.lastViewKey = viewKey;
            }

            return originalRender(...args);

        };

    }

}
