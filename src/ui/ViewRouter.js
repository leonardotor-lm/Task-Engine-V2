import { TaskList } from "./TaskList.js";
import { EntityManager } from "./EntityManager.js";
import { View } from "../core/View.js";

export class ViewRouter {

    constructor() {

        this.taskList = new TaskList();
        this.entityManager = new EntityManager();

    }

    renderTaskList(
        state,
        title,
        allowCreate = false
    ) {

        return this.taskList.render(

            state.tasks,
            title,
            allowCreate,
            state.areas,
            state.contexts,
            state.tags,
            state.searchQuery,
            state.expandedTaskIds,
            state.filtersActive,
            state.selectedTaskIds,
            state.bulkSelectionEnabled,
            state.bulkActionMode

        );

    }

    render(state) {

        switch (state.view) {

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
                    "Papelera"
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
                    "Inbox",
                    true
                );

        }

    }

}
