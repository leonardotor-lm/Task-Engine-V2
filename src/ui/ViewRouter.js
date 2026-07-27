import { TaskList } from "./TaskList.js";
import { EntityManager } from "./EntityManager.js";
import { ProjectView } from "./ProjectView.js";
import { View } from "../core/View.js";

export class ViewRouter {

    constructor() {

        this.taskList = new TaskList();
        this.entityManager = new EntityManager();
        this.projectView = new ProjectView();

    }

    renderTaskList(
        state,
        title,
        headingActions = ""
    ) {

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
            state.inlineSubtaskParentId

        );

    }

    render(state) {

        switch (state.view) {

            case View.PROJECT:

                return this.projectView.render(state);

            case View.TODAY:

                return this.renderTaskList(
                    state,
                    "Hoy y atrasadas"
                );

            case View.UPCOMING:

                return this.renderTaskList(
                    state,
                    "Próximas"
                );

            case View.ALL:

                return this.renderTaskList(
                    state,
                    "Todas"
                );

            case View.AREA:

                return this.renderTaskList(
                    state,
                    state.activeArea?.name ??
                        "Área"
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
                                class="dangerAction">
                                Vaciar papelera
                            </button>
                        `
                        : ""
                );

            case View.AREAS:

                return this.entityManager.render(
                    "Áreas",
                    state.areas
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
                    "Inbox"
                );

        }

    }

}
