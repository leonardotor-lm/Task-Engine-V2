import { Sidebar } from "./Sidebar.js";
import { TaskList } from "./TaskList.js";

export class MainView {

    constructor(callbacks) {

        this.callbacks = callbacks;

        this.sidebar = new Sidebar();

        this.taskList = new TaskList();

    }

    render(tasks = [], selectedTask = null) {

        const app = document.getElementById("app");

        let html = `
            <div class="layout">

                ${this.sidebar.render()}

                ${this.taskList.render(tasks)}

                <aside class="details">
        `;

        if (selectedTask) {

            html += `
                <h3>Detalle</h3>

                <p><strong>${selectedTask.title}</strong></p>

                <p>${selectedTask.description || "Sin descripción"}</p>

                <button id="toggleTask">
                    ${selectedTask.isCompleted()
                        ? "Marcar pendiente"
                        : "Completar"}
                </button>

                <button id="editTask">
                    Editar
                </button>
            `;

        } else {

            html += `
                <h3>Detalle</h3>
                <p>Seleccioná una tarea.</p>
            `;

        }

        html += `
                </aside>

            </div>
        `;

        app.innerHTML = html;

        this.bindEvents(selectedTask);

    }

    bindEvents(selectedTask) {

        document.getElementById("taskForm").addEventListener("submit", (e) => {

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

            document.getElementById("toggleTask").addEventListener("click", () => {

                this.callbacks.onToggleTask(selectedTask.id);

            });

            document.getElementById("editTask").addEventListener("click", () => {

                alert("Próximamente");

            });

        }

    }

}
