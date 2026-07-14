export class MainView {

    constructor(callbacks) {
        this.callbacks = callbacks;
    }

    render(tasks = [], selectedTask = null) {

        const app = document.getElementById("app");

        let html = `
            <h2>Mis tareas</h2>

            <form id="taskForm">
                <input
                    id="taskTitle"
                    type="text"
                    placeholder="Nueva tarea"
                    autocomplete="off">

                <button type="submit">Agregar</button>
            </form>

            <ul>
        `;

        for (const task of tasks) {

            const completed = task.status === "COMPLETED";

            html += `
                <li
                    class="task"
                    data-id="${task.id}"
                    style="
                        cursor:pointer;
                        ${completed ? "text-decoration: line-through; color: gray;" : ""}
                    ">
                    ${task.title}
                </li>
            `;
        }

        html += "</ul>";

        html += `
            <hr>

            <h3>Tarea seleccionada</h3>
        `;

        if (selectedTask) {

            html += `
                <p><strong>Título:</strong> ${selectedTask.title}</p>
                <p><strong>Descripción:</strong> ${selectedTask.description || "-"}</p>

                <button id="toggleTask">
                    ${selectedTask.status === "COMPLETED" ? "Marcar pendiente" : "Completar"}
                </button>

                <button id="editTask">
                    Editar
                </button>
            `;

        } else {

            html += `<p>No hay ninguna tarea seleccionada.</p>`;

        }

        app.innerHTML = html;

        this.bindEvents(selectedTask);

    }

    bindEvents(selectedTask) {

        document.getElementById("taskForm").addEventListener("submit", (event) => {

            event.preventDefault();

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

                alert("Editor de tareas: próximo paso.");

            });

        }

    }

}
