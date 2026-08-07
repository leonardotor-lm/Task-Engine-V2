import { View } from "../core/View.js";
import {
    compileAdvancedSearch
} from "../core/AdvancedSearch.js";

export class SyncNavigationPreservationController {

    constructor(app) {

        this.app = app;
        this.started = false;

    }

    start() {

        if (
            this.started ||
            !this.app ||
            typeof this.app.resetTransientState !==
                "function"
        ) {
            return;
        }

        this.started = true;

        const originalResetTransientState =
            this.app.resetTransientState
                .bind(this.app);

        this.app.resetTransientState = (...args) => {

            if (!this.shouldPreserveNavigation()) {
                return originalResetTransientState(
                    ...args
                );
            }

            const navigation =
                this.captureNavigation();
            const result =
                originalResetTransientState(
                    ...args
                );

            this.restoreNavigation(navigation);

            return result;

        };

    }

    shouldPreserveNavigation() {

        return Boolean(
            this.app.autoSyncInProgress ||
            this.app.syncCheckInProgress
        );

    }

    captureNavigation() {

        return {
            currentView: this.app.currentView,
            currentAreaId: this.app.currentAreaId,
            projectTaskId: this.app.projectTaskId,
            previousProjectView:
                this.app.previousProjectView,
            projectHistory: [
                ...(this.app.projectHistory ?? [])
            ],
            calendarMonth: this.app.calendarMonth,
            calendarSelectedDate:
                this.app.calendarSelectedDate,
            currentGoalStatus:
                this.app.currentGoalStatus,
            selectedGoalId:
                this.app.selectedGoal?.id ?? null,
            selectedTaskId:
                this.app.selectedTask?.id ?? null,
            currentCustomFilterId:
                this.app.currentCustomFilterId,
            searchQuery: this.app.searchQuery,
            advancedSearchMode:
                this.app.advancedSearchMode,
            advancedSearchExpression:
                this.app.advancedSearchExpression,
            advancedSearchError:
                this.app.advancedSearchError,
            expandedTaskIds: [
                ...(this.app.expandedTaskIds ?? [])
            ],
            goalExpandedTaskIds: [
                ...(this.app.goalExpandedTaskIds ?? [])
            ],
            bulkSelectionMode:
                this.app.bulkSelectionMode,
            selectedTaskIds: [
                ...(this.app.selectedTaskIds ?? [])
            ],
            settingsDialogOpen:
                this.app.settingsDialogOpen,
            settingsSection:
                this.app.settingsSection
        };

    }

    restoreNavigation(navigation) {

        this.app.currentView =
            navigation.currentView;
        this.app.currentAreaId =
            navigation.currentAreaId;
        this.app.projectTaskId =
            navigation.projectTaskId;
        this.app.previousProjectView =
            navigation.previousProjectView;
        this.app.projectHistory =
            this.filterExistingTaskIds(
                navigation.projectHistory
            );
        this.app.calendarMonth =
            navigation.calendarMonth;
        this.app.calendarSelectedDate =
            navigation.calendarSelectedDate;
        this.app.currentGoalStatus =
            navigation.currentGoalStatus;
        this.app.settingsDialogOpen =
            navigation.settingsDialogOpen;
        this.app.settingsSection =
            navigation.settingsSection;

        this.restoreAreaView(navigation);
        this.restoreProjectView(navigation);
        this.restoreGoalView(navigation);
        this.restoreSearchState(navigation);

        this.app.expandedTaskIds = new Set(
            this.filterExistingTaskIds(
                navigation.expandedTaskIds
            )
        );
        this.app.goalExpandedTaskIds = new Set(
            this.filterExistingTaskIds(
                navigation.goalExpandedTaskIds
            )
        );
        this.app.selectedTaskIds = new Set(
            this.filterExistingTaskIds(
                navigation.selectedTaskIds
            )
        );
        this.app.bulkSelectionMode =
            Boolean(
                navigation.bulkSelectionMode &&
                this.app.selectedTaskIds.size > 0
            );

        this.app.selectedTask =
            navigation.selectedTaskId
                ? this.app.taskService
                    ?.getTaskById?.(
                        navigation.selectedTaskId
                    ) ?? null
                : null;

    }

    restoreAreaView(navigation) {

        if (
            navigation.currentView !== View.AREA
        ) {
            return;
        }

        const areaExists =
            navigation.currentAreaId &&
            this.app.areaService
                ?.getAreaById?.(
                    navigation.currentAreaId
                );

        if (areaExists) {
            return;
        }

        this.app.currentView = View.AREAS;
        this.app.currentAreaId = null;

    }

    restoreProjectView(navigation) {

        if (
            navigation.currentView !== View.PROJECT
        ) {
            return;
        }

        const projectExists =
            navigation.projectTaskId &&
            this.app.taskService
                ?.getTaskById?.(
                    navigation.projectTaskId
                );

        if (projectExists) {
            return;
        }

        this.app.currentView = View.ALL;
        this.app.projectTaskId = null;
        this.app.projectHistory = [];

    }

    restoreGoalView(navigation) {

        if (
            navigation.currentView !== View.GOAL
        ) {
            this.app.selectedGoal = null;
            return;
        }

        const goal = navigation.selectedGoalId
            ? this.app.goalService
                ?.getGoalById?.(
                    navigation.selectedGoalId
                ) ?? null
            : null;

        if (goal) {
            this.app.selectedGoal = goal;
            return;
        }

        this.app.currentView = View.GOALS;
        this.app.selectedGoal = null;

    }

    restoreSearchState(navigation) {

        const filterId =
            navigation.currentCustomFilterId;

        if (filterId) {

            const filter =
                this.app.customFilterService
                    ?.getFilterById?.(filterId);

            if (filter) {

                try {
                    this.app.currentView = View.ALL;
                    this.app.currentAreaId = null;
                    this.app.projectTaskId = null;
                    this.app.projectHistory = [];
                    this.app.advancedSearchMode = true;
                    this.app.searchQuery = filter.query;
                    this.app.advancedSearchExpression =
                        compileAdvancedSearch(
                            filter.query
                        );
                    this.app.advancedSearchError = "";
                    this.app.currentCustomFilterId =
                        filterId;
                    return;
                } catch {
                    // Un filtro remoto inválido se desactiva sin romper la vista.
                }

            }

        }

        this.app.currentCustomFilterId = null;
        this.app.searchQuery =
            navigation.searchQuery;
        this.app.advancedSearchMode =
            navigation.advancedSearchMode;
        this.app.advancedSearchExpression =
            navigation.advancedSearchExpression;
        this.app.advancedSearchError =
            navigation.advancedSearchError;

    }

    filterExistingTaskIds(ids) {

        if (
            !this.app.taskService
                ?.getTaskById
        ) {
            return [...ids];
        }

        return ids.filter(id =>
            Boolean(
                this.app.taskService
                    .getTaskById(id)
            )
        );

    }

}
