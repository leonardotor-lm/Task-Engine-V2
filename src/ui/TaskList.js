import { PriorityOptions } from "./PriorityOptions.js";
import { escapeHtml } from "./escapeHtml.js";
import { flattenTaskTree } from "../core/TaskTree.js";

export class TaskList {

    render(
        tasks,
        title,
        allowCreate = false,
        areas = [],
        contexts = [],
        tags = [],
        searchQuery = "",
        expandedTaskIds = new Set()
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


        const childrenByParent = new Map();

        for (const task of tasks) {

            if (!task.parentTaskId) continue;

            const children =
                childrenByParent.get(task.parentTaskId) ?? [];

            children.push(task);
            childrenByParent.set(task.parentTaskId, children);

        }

        const visibleRows = flattenTaskTree(
            tasks,
            searchQuery ? null : expandedTaskIds
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

            for (const { task, depth } of visibleRows) {

                const children =
                    childrenByParent.get(task.id) ?? [];

                const totalSubtasks = children.length;

                const completedSubtasks = children.filter(
                    child => child.isCompleted()
                ).length;

                const hasSubtasks = totalSubtasks > 0;

                const isExpanded =
                    Boolean(searchQuery) ||
                    expandedTaskIds.has(task.id);

                const toggleHtml = hasSubtasks
                    ? `
                        <button
                            type="button"
                            class="toggleSubtasks"
                            data-id="${escapeHtml(task.id)}"
                            aria-label="${isExpanded
                                ? "Contraer subtareas"
                                : "Expandir subtareas"}">
                            ${isExpanded ? "▼" : "▶"}
                        </button>
                    `
                    : `
                        <span class="toggleSubtasksSpacer"></span>
                    `;

                const progressHtml = hasSubtasks
                    ? `
                        <span class="subtaskProgress">
                            (${completedSubtasks}/${totalSubtasks})
                        </span>
                    `
                    : "";

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

                const recurrenceLabels = {
                    DAILY: "Diaria",
                    WEEKLY: "Semanal",
                    MONTHLY: "Mensual"
                };

                if (task.recurrence) {

                    metadata.push(
                        `Repetición: ${recurrenceLabels[task.recurrence]}`
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
                        class="task ${depth > 0 ? "subtask" : ""} ${task.isCompleted() ? "completedTask" : ""}"
                        style="--task-depth:${depth}"
                        data-id="${escapeHtml(task.id)}">

                        <div class="taskHeader">

                            ${toggleHtml}

                            <span class="taskTitle">
                                ${depth > 0 ? "↳ " : ""}${escapeHtml(task.title)}
                            </span>

                            ${progressHtml}

                        </div>

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
