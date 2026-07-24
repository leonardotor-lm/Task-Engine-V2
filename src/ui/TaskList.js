import { PriorityOptions } from "./PriorityOptions.js";
import { escapeHtml } from "./escapeHtml.js";

export class TaskList {

    render(
        tasks,
        title,
        allowCreate = false,
        areas = [],
        contexts = [],
        tags = [],
        searchQuery = ""
    ) {

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

        const areasById = new Map(
            areas.map(area => [area.id, area])
        );

        const contextsById = new Map(
            contexts.map(context => [context.id, context])
        );

        const tagsById = new Map(
            tags.map(tag => [tag.id, tag])
        );

        let html = `
            <main class="content">

                <h2>${escapeHtml(title)}</h2>

                ${form}
        `;

        if (tasks.length === 0) {

            html += `
                <p class="emptyState">
                    ${searchQuery
                        ? "No se encontraron tareas que coincidan con la búsqueda."
                        : "No hay tareas para mostrar en esta vista."}
                </p>
            `;

        } else {

            html += `
                <ul class="taskList">
            `;

            for (const task of tasks) {

                const area = areasById.get(task.areaId);

                const context = contextsById.get(task.contextId);

                const priority = PriorityOptions.find(
                    option => option.value === task.priority
                );

                const metadata = [];

                if (task.dueDate) {

                    metadata.push(
                        `Fecha: ${this.formatDate(task.dueDate)}`
                    );

                }

                if (area) {

                    metadata.push(
                        `Área: ${area.name}`
                    );

                }

                if (context) {

                    metadata.push(
                        `Contexto: ${context.name}`
                    );

                }

                const taskTags = task.tagIds
                    .map(tagId => tagsById.get(tagId))
                    .filter(Boolean);

                if (taskTags.length > 0) {

                    metadata.push(
                        `Etiquetas: ${taskTags
                            .map(tag => tag.name)
                            .join(", ")}`
                    );

                }

                if (priority && priority.value !== 0) {

                    metadata.push(
                        `Prioridad: ${priority.label}`
                    );

                }

                const metadataHtml = metadata.length > 0
                    ? `
                        <small class="taskMeta">
                            ${escapeHtml(metadata.join(" · "))}
                        </small>
                    `
                    : "";

                html += `
                    <li
                        class="task"
                        data-id="${escapeHtml(task.id)}">

                        <span class="taskTitle">
                            ${escapeHtml(task.title)}
                        </span>

                        ${metadataHtml}

                    </li>
                `;

            }

            html += `
                </ul>
            `;

        }

        html += `
            </main>
        `;

        return html;

    }

    formatDate(date) {

        const [
            year,
            month,
            day
        ] = date.split("-");

        return `${day}/${month}/${year}`;

    }

}
