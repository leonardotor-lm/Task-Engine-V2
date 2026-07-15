import { Sidebar } from "./Sidebar.js";
import { TaskList } from "./TaskList.js";
import { TaskDetails } from "./TaskDetails.js";
import { AreaManager } from "./AreaManager.js";
import { View } from "../core/View.js";

export class MainView {

    constructor(callbacks) {

        this.callbacks = callbacks;

        this.sidebar = new Sidebar();
        this.taskList = new TaskList();
        this.taskDetails = new TaskDetails();
        this.areaManager = new AreaManager();

    }

    render(state) {

        const {

            view,
            tasks,
            selectedTask,
            areas

        } = state;

        const app = document.getElementById("app");

        let center;

        if (view === View.AREAS) {

            center = this.areaManager.render(areas);

        } else {

            center = this.taskList.render(tasks);

        }

        app.innerHTML = `
            <div class="layout">

                ${this.sidebar.render()}

                ${center}

                ${this.taskDetails.render(selectedTask)}

            </div>
        `;

        this.bindEvents(state);

    }

    bindEvents(state) {

        const { view, selectedTask } = state;

        document.getElementById("showTasks")?.addEventListener("click", () => {

            this.callbacks.onShowTasks();

        });

        document.getElementById("manageAreas")?.addEventListener("click", () => {

            this.callbacks.onShowAreas();

        });

        if (view === View.TASKS) {

            document.getElementById("taskForm")?.addEventListener("submit", e => {

                e.preventDefault();

                const input = document.getElementById("taskTitle");

                const title = input.value.trim();

                if (!title) return;

                this.callbacks.onCreateTask(title);

            });

            document.querySelectorAll(".task").forEach(item => {

                item.addEventListener("click", () => {

                    this.callbacks.onSelectTask(item.dataset.id);

                });

            });

            if (selectedTask) {

                document.getElementById("toggleTask")?.addEventListener("click", () => {

                    this.callbacks.onToggleTask(selectedTask.id);

                });

            }

        }

    }

}
