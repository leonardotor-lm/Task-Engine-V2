import { TaskList } from "./TaskList.js";
import { EntityManager } from "./EntityManager.js";
import { View } from "../core/View.js";

export class ViewRouter {

    constructor() {

        this.taskList = new TaskList();
        this.entityManager = new EntityManager();

    }

    render(state) {

        switch (state.view) {

            case View.TODAY:

                return this.taskList.render(
                    state.tasks,
                    "Hoy y atrasadas"
                );

            case View.UPCOMING:

                return this.taskList.render(
                    state.tasks,
                    "Próximas"
                );

            case View.ALL:

                return this.taskList.render(
                    state.tasks,
                    "Todas"
                );

            case View.COMPLETED:

                return this.taskList.render(
                    state.tasks,
                    "Completadas"
                );

            case View.ARCHIVED:

                return this.taskList.render(
                    state.tasks,
                    "Archivadas"
                );

            case View.TRASH:

                return this.taskList.render(
                    state.tasks,
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

            case View.INBOX:
            default:

                return this.taskList.render(
                    state.tasks,
                    "Inbox",
                    true
                );

        }

    }

}