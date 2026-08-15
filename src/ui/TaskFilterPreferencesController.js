import { View } from "../core/View.js";
import {
    EMPTY_TASK_FILTERS,
    TaskFilterPreferencesRepository
} from "../infrastructure/TaskFilterPreferencesRepository.js";
import {
    getTaskSortViewKey
} from "./TaskSortPreferencesController.js";

const FILTER_VIEWS = new Set([
    View.INBOX,
    View.TODAY,
    View.TOMORROW,
    View.UPCOMING,
    View.ALL,
    View.PROJECTS,
    View.AREA,
    View.COMPLETED,
    View.ARCHIVED,
    View.TRASH
]);

export class TaskFilterPreferencesController {

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
            app?.taskFilterPreferencesRepository ??
            new TaskFilterPreferencesRepository(
                storage
            );
        this.started = false;

    }

    start() {

        if (this.started || !this.app) {
            return;
        }

        this.started = true;
        this.app.taskFilterPreferencesRepository =
            this.repository;

        this.wrapFilterCallbacks();
        this.wrapRender();

    }

    supportsCurrentView() {

        return (
            FILTER_VIEWS.has(this.app.currentView) &&
            !this.app.advancedSearchMode &&
            !this.app.currentCustomFilterId
        );

    }

    getViewKey() {

        return this.supportsCurrentView()
            ? getTaskSortViewKey(this.app)
            : null;

    }

    readFilters() {

        const viewKey = this.getViewKey();

        return viewKey
            ? this.repository.get(viewKey)
            : { ...EMPTY_TASK_FILTERS };

    }

    wrapFilterCallbacks() {

        const callbacks =
            this.app.mainView?.callbacks;

        if (!callbacks) return;

        const originalApply =
            callbacks.onApplyTaskFilters;
        const originalClear =
            callbacks.onClearTaskFilters;

        if (typeof originalApply === "function") {

            callbacks.onApplyTaskFilters = filters => {

                const viewKey = this.getViewKey();

                if (viewKey) {
                    this.repository.set(
                        viewKey,
                        filters
                    );
                }

                return originalApply(filters);

            };

        }

        if (typeof originalClear === "function") {

            callbacks.onClearTaskFilters = () => {

                const viewKey = this.getViewKey();

                if (viewKey) {
                    this.repository.set(
                        viewKey,
                        EMPTY_TASK_FILTERS
                    );
                }

                return originalClear();

            };

        }

    }

    wrapRender() {

        if (typeof this.app.render !== "function") {
            return;
        }

        const originalRender =
            this.app.render.bind(this.app);

        this.app.render = (...args) => {

            if (this.supportsCurrentView()) {
                this.app.taskFilters =
                    this.readFilters();
            }

            return originalRender(...args);

        };

    }

}
