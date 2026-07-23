import { escapeHtml } from "./escapeHtml.js";

export class TaskList {

    render(tasks, title, allowCreate = false) {

        const form = allowCreate
            ? `
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
            `
            : "";

        let html = `
            <main class="content">

                <h2>${escapeHtml(title)}</h2>

                ${form}

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