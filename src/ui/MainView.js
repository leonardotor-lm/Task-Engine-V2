import { Sidebar } from "./Sidebar.js";
import { TaskDetails } from "./TaskDetails.js";
import { ViewRouter } from "./ViewRouter.js";
import { View } from "../core/View.js";
import { Dialog } from "../components/Dialog.js";

export class MainView {

    constructor(callbacks) {

        this.callbacks = callbacks;

        this.sidebar = new Sidebar();
        this.taskDetails = new TaskDetails();
        this.viewRouter = new ViewRouter();

    }

    render(state) {

        const {
            selectedTask,
            areas
        } = state;

        document.getElementById("app").innerHTML = `
            <div class="layout">

                ${this.sidebar.render()}

                ${this.viewRouter.render(state)}

                ${this.taskDetails.render(selectedTask, areas)}

            </div>
        `;

        this.bindEvents(state);

    }

    bindEvents(state) {

        const { view, selectedTask, areas } = state;

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

        if (view === View.AREAS) {

            document.getElementById("entityForm")?.addEventListener("submit", e => {

                e.preventDefault();

                const name = document.getElementById("entityName").value.trim();
                const color = document.getElementById("entityColor").value;

                if (!name) return;

                this.callbacks.onCreateArea(name, color);

            });

            document.querySelectorAll(".deleteEntity").forEach(button => {

                button.addEventListener("click", () => {

                    if (Dialog.confirm("¿Eliminar esta área?")) {

                        this.callbacks.onDeleteArea(button.dataset.id);

                    }

                });

            });

            document.querySelectorAll(".editEntity").forEach(button => {

                button.addEventListener("click", () => {

                    const area = areas.find(a => a.id === button.dataset.id);

                    if (!area) return;

                    const nombre = Dialog.prompt(
                        "Nombre del área:",
                        area.name
                    );

                    if (nombre === null || nombre === "") return;

                    this.callbacks.onUpdateArea(area.id, nombre);

                });

            });

        }

    }

}
