import { TaskList } from "./TaskList.js";
import { EntityManager } from "./EntityManager.js";
import { ProjectView } from "./ProjectView.js";
import { GoalList } from "./GoalList.js";
import { GoalView } from "./GoalView.js";
import { CalendarView } from "./CalendarView.js";
import { ActivityView } from "./ActivityView.js";
import { StatisticsView } from "./StatisticsView.js";
import { View } from "../core/View.js";
import { escapeHtml } from "./escapeHtml.js";
import { Icon } from "./Icon.js";

export class ViewRouter {

    constructor() {

        this.taskList = new TaskList();
        this.entityManager = new EntityManager();
        this.projectView = new ProjectView();
        this.goalList = new GoalList();
        this.goalView = new GoalView();
        this.calendarView = new CalendarView();
        this.activityView = new ActivityView();
        this.statisticsView = new StatisticsView();

    }

    renderTaskList(
        state,
        title,
        headingActions = ""
    ) {

        const activeSearchNotice =
            state.advancedSearchMode &&
            state.searchQuery
                ? `
                    <aside
                        class="advancedSearchActiveNotice"
                        role="status">
                        <span>
                            <strong>Búsqueda avanzada activa</strong>
                            <span class="advancedSearchActiveQuery">
                                ${escapeHtml(state.searchQuery)}
                            </span>
                        </span>

                        <button
                            id="clearActiveAdvancedSearch"
                            type="button"
                            class="tertiaryAction">
                            Limpiar
                        </button>
                    </aside>
                `
                : "";

        return this.taskList.render(

            state.tasks,
            title,
            state.taskCreationOpen,
            state.areas,
            state.contexts,
            state.tags,
            state.searchQuery,
            state.expandedTaskIds,
            state.filtersActive,
            state.selectedTaskIds,
            state.bulkSelectionEnabled,
            state.bulkActionMode,
            state.showTaskMetadata,
            state.today,
            state.allTasks,
            headingActions,
            "Nueva tarea",
            state.inlineSubtaskParentId,
            activeSearchNotice,
            state.goals

        );

    }

    render(state) {

        const titleWithCount = (
            title,
            countKey
        ) => {

            const count =
                state.taskViewCounts?.[countKey] ?? 0;

            return `${title} (${count})`;

        };

        switch (state.view) {

            case View.ACTIVITY:

                return this.activityView.render(state);

            case View.STATISTICS:

                return this.statisticsView.render(state);

            case View.CALENDAR:

                return this.calendarView.render(state);

            case View.PROJECT:

                return this.projectView.render(state);

            case View.GOALS:

                return this.goalList.render(
                    state.goals,
                    state.currentGoalStatus,
                    state.goalCreationOpen
                );

            case View.GOAL:

                return this.goalView.render(state);

            case View.TODAY:

                return this.renderTaskList(
                    state,
                    titleWithCount(
                        "Hoy y atrasadas",
                        "today"
                    )
                );

            case View.TOMORROW:

                return this.renderTaskList(
                    state,
                    titleWithCount(
                        "Mañana",
                        "tomorrow"
                    )
                );

            case View.UPCOMING:

                return this.renderTaskList(
                    state,
                    titleWithCount(
                        "Próximas",
                        "upcoming"
                    )
                );

            case View.ALL:

                return this.renderTaskList(
                    state,
                    titleWithCount(
                        "Todas",
                        "all"
                    )
                );

            case View.PROJECTS:

                return this.renderTaskList(
                    state,
                    titleWithCount(
                        "Proyectos",
                        "projects"
                    )
                );

            case View.AREA:

                return this.renderTaskList(
                    state,
                    titleWithCount(
                        state.activeArea?.name ??
                            "Área",
                        `area:${state.activeArea?.id ?? ""}`
                    )
                );

            case View.COMPLETED:

                return this.renderTaskList(
                    state,
                    "Completadas"
                );

            case View.ARCHIVED:

                return this.renderTaskList(
                    state,
                    "Archivadas"
                );

            case View.TRASH:

                return this.renderTaskList(
                    state,
                    "Papelera",
                    state.allTasks.some(
                        task => task.isDeleted()
                    )
                        ? `
                            <button
                                id="emptyTrash"
                                type="button"
                                class="dangerAction responsiveIconButton"
                                aria-label="Vaciar papelera"
                                title="Vaciar papelera">
                                <span class="responsiveButtonIcon">
                                    ${Icon.render("trash")}
                                </span>
                                <span class="responsiveButtonLabel">
                                    Vaciar papelera
                                </span>
                            </button>
                        `
                        : ""
                );

            case View.AREAS:

                return this.entityManager.render(
                    "Áreas",
                    state.areas,
                    { reorderable: true }
                );

            case View.CONTEXTS:

                return this.entityManager.render(
                    "Contextos",
                    state.contexts
                );

            case View.TAGS:

                return this.entityManager.render(
                    "Etiquetas",
                    state.tags
                );

            case View.INBOX:
            default:

                return this.renderTaskList(
                    state,
                    titleWithCount(
                        "Inbox",
                        "inbox"
                    )
                );

        }

    }

}
