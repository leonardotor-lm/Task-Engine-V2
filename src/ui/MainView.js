export class MainView {

    constructor(callbacks) {

        this.callbacks = callbacks;

    }

    render(tasks = []) {

        const app = document.getElementById("app");

        let html = `
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
                    style="
                        cursor:pointer;
                        ${completed ? "text-decoration: line-through; color: gray;" : ""}
                    ">
                    ${task.title}
                </li>
            `;
        }

        html += "</ul>";

        app.innerHTML = html;

        this.bindEvents();

    }

    bindEvents() {

        const form = document.getElementById("taskForm");

        form.addEventListener("submit", (event) => {

            event.preventDefault();

            const input = document.getElementById("taskTitle");

            const title = input.value.trim();

            if (!title) {
                return;
            }

            this.callbacks.onCreateTask(title);

        });

        document.querySelectorAll(".task").forEach(item => {

            item.addEventListener("click", () => {

                this.callbacks.onToggleTask(item.dataset.id);

            });

        });

    }

}
