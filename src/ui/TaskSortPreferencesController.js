import { TaskSort } from "../core/TaskSorting.js";
import { View } from "../core/View.js";
import {
    TaskSortPreferencesRepository
} from "../infrastructure/TaskSortPreferencesRepository.js";

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
            repository = null,
            storage = globalThis.localStorage
        } = {}
    ) {

        this.app = app;
        this.repository =
            repository ??
            app?.taskSortPreferencesRepository ??
            new TaskSortPreferencesRepository(
                storage
            );
        this.started = false;

    }

    start() {

        if (this.started || !this.app) {
            return;
        }

        this.started = true;

        this.app.taskSortPreferencesRepository =
            this.repository;

        this.app.backupService
            ?.setTaskSortPreferencesRepository?.(
                this.repository
            );

        this.wrapSortCallback();
        this.wrapRender();

    }

    normalizeSort(sort) {

        return this.repository
            ?.normalizeSort?.(sort) ??
            (
                Object.values(TaskSort)
                    .includes(sort)
                    ? sort
                    : TaskSort.MANUAL
            );

    }

    readPreferences() {

        return this.repository?.getAll?.() ?? {};

    }

    readSort(viewKey) {

        return this.repository?.get?.(viewKey) ??
            TaskSort.MANUAL;

    }

    writeSort(viewKey, sort) {

        if (!viewKey) {
            return TaskSort.MANUAL;
        }

        return this.repository?.set?.(
            viewKey,
            sort
        ) ?? TaskSort.MANUAL;

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
                this.writeSort(
                    this.getViewKey(),
                    sort
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

            this.app.taskSort =
                this.readSort(
                    this.getViewKey()
                );

            return originalRender(...args);

        };

    }

}
