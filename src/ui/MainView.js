export class MainView {

    constructor(callbacks) {
        this.callbacks = callbacks;
    }

    render(tasks = [], selectedTask = null) {

        const app = document.getElementById("app");

        let html = `
            <div class="layout">

                <aside class="sidebar">

                    <h3>Task Engine</h3>

                    <nav>
                        <button>Inbox</button>
                        <button>Hoy</button>
                        <button>Próximas</button>
                        <button>Todas</button>
                    </nav>

                </aside>

                <main class="content">

                    <h2>Mis tareas</h2>

                    <form id="taskForm">

                        <input
                            id="taskTitle"
                            type="text"
                            placeholder="Nueva tarea"
                            autocomplete="off">

                        <button type="submit">
                            Agregar
                        </button>

                    </form>

                    <ul>
        `;

        for (const task of tasks) {

            const completed = task.status === "COMPLETED";

            html += `
                <li
                    class="task"
                    data-id="${task.id}"
                    style="${completed ? "text-decoration:line-through;color:gray;" : ""}">
                    ${task.title}
                </li>
            `;

        }

        html += `
                    </ul>

                </main>

                <aside class="details">
        `;

        if (selectedTask) {

            html += `
                <h3>Detalle</h3>

                <p><strong>${selectedTask.title}</strong></p>

                <p>${selectedTask.description || "Sin descripción"}</p>

                <button id="toggleTask">
                    ${selectedTask.status === "COMPLETED"
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

        document.getElementById("taskForm").addEventListener("submit", e => {

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
