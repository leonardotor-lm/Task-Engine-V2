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

            case View.AREAS:
                return this.entityManager.render(
                    "Áreas",
                    state.areas
                );

            case View.TASKS:
            default:
                return this.taskList.render(
                    state.tasks
                );

        }

    }

}
