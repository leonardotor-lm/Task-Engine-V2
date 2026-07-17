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

        const center = view === View.AREAS
            ? this.areaManager.render(areas)
            : this.taskList.render(tasks);

        document.getElementById("app").innerHTML = `
            <div class="layout">

                ${this.sidebar.render()}

                ${center}

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

            document.getElementById("areaForm")?.addEventListener("submit", e => {

                e.preventDefault();

                const name = document.getElementById("areaName").value.trim();
                const color = document.getElementById("areaColor").value;

                if (!name) return;

                this.callbacks.onCreateArea(name, color);

            });

            document.querySelectorAll(".deleteArea").forEach(button => {

                button.addEventListener("click", () => {

                    this.callbacks.onDeleteArea(button.dataset.id);

                });

            });

            document.querySelectorAll(".editArea").forEach(button => {

                button.addEventListener("click", () => {

                    const area = areas.find(a => a.id === button.dataset.id);

                    if (!area) return;

                    const nuevoNombre = prompt("Nombre del área:", area.name);

                    if (nuevoNombre === null) return;

                    const nombre = nuevoNombre.trim();

                    if (!nombre) return;

                    this.callbacks.onUpdateArea(area.id, nombre);

                });

            });

        }

    }

}
