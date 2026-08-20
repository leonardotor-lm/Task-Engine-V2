import {
    matchesAdvancedSearch
} from "../core/AdvancedSearch.js";

export class StrictAdvancedSearchResultsController {

    constructor(app) {
        this.app = app;
        this.started = false;
    }

    start() {

        if (
            this.started ||
            !this.app?.mainView?.render
        ) {
            return;
        }

        this.started = true;

        const originalRender =
            this.app.mainView.render.bind(
                this.app.mainView
            );

        this.app.mainView.render = state =>
            originalRender(
                this.filterState(state)
            );

    }

    filterState(state) {

        if (
            !state?.advancedSearchMode ||
            !this.app?.advancedSearchExpression
        ) {
            return state;
        }

        const searchContext = {
            areas: state.areas ?? [],
            contexts: state.contexts ?? [],
            tags: state.tags ?? [],
            goals: state.goals ?? [],
            tasks: state.allTasks ?? [],
            today: state.today ?? ""
        };

        const tasks = (state.tasks ?? [])
            .filter(task =>
                matchesAdvancedSearch(
                    task,
                    this.app.advancedSearchExpression,
                    searchContext
                )
            );

        const visibleIds = new Set(
            tasks.map(task => task.id)
        );

        return {
            ...state,
            tasks,
            selectedTaskIds:
                state.selectedTaskIds instanceof Set
                    ? new Set(
                        [...state.selectedTaskIds]
                            .filter(id =>
                                visibleIds.has(id)
                            )
                    )
                    : state.selectedTaskIds
        };

    }

}
