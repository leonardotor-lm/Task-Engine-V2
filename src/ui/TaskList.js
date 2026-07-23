import { escapeHtml } from "./escapeHtml.js";

export class TaskList {

    render(tasks) {

        let html = `
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
                    data-id="${escapeHtml(task.id)}"
                    style="${completed
                        ? "text-decoration:line-through;color:gray;"
                        : ""}">

                    ${escapeHtml(task.title)}

                </li>
            `;

        }

        html += `
                </ul>

            </main>
        `;

        return html;

    }

}