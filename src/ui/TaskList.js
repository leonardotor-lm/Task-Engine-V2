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
        expandedTaskIds = new Set(),
        filtersActive = false,
        selectedTaskIds = new Set(),
        bulkSelectionEnabled = false,
        bulkActionMode = null
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
            searchQuery || filtersActive
                ? null
                : expandedTaskIds
        );

        let html = `
            <main class="content">

                <h2>${escapeHtml(title)}</h2>

                ${bulkSelectionEnabled &&
                    selectedTaskIds.size > 0
                    ? this.renderBulkToolbar(
                        selectedTaskIds.size,
                        areas,
                        contexts,
                        tags,
                        bulkActionMode
                    )
                    : ""}

                ${form}
        `;

        if (tasks.length === 0) {

            html += `
                <p class="emptyState">
                    ${searchQuery || filtersActive
                        ? "No se encontraron tareas que coincidan con los criterios."
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
                    filtersActive ||
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

                if (task.postponements.length > 0) {

                    metadata.push(
                        `Pospuesta: ${task.postponements.length} ${task.postponements.length === 1 ? "vez" : "veces"}`
                    );

                }

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
                        class="task ${depth > 0 ? "subtask" : ""} ${task.isCompleted() ? "completedTask" : ""} ${selectedTaskIds.has(task.id) ? "bulkSelectedTask" : ""}"
                        style="--task-depth:${depth}"
                        data-id="${escapeHtml(task.id)}">

                        <div class="taskHeader">

                            ${toggleHtml}

                            ${bulkSelectionEnabled &&
                                this.isBulkSelectable(
                                    task,
                                    bulkActionMode
                                )
                                ? `
                                    <input
                                        type="checkbox"
                                        class="bulkTaskCheckbox"
                                        data-id="${escapeHtml(task.id)}"
                                        aria-label="Seleccionar ${escapeHtml(task.title)}"
                                        ${selectedTaskIds.has(task.id)
                                            ? "checked"
                                            : ""}>
                                `
                                : ""}

                            <span class="taskTitle">
                                ${depth > 0 ? "↳ " : ""}
                                ${task.recurrence
                                    ? '<span class="recurrenceIcon" title="Tarea recurrente">↻</span> '
                                    : ""}
                                ${escapeHtml(task.title)}
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

    isBulkSelectable(task, mode) {

        switch (mode) {

            case "ACTIVE":
                return !task.isCompleted();

            case "COMPLETED":
                return (
                    task.isCompleted() &&
                    !task.recurrence
                );

            case "ARCHIVED":
                return task.isArchived();

            case "TRASH":
                return task.isDeleted();

            default:
                return false;

        }

    }

    renderBulkToolbar(
        selectedCount,
        areas,
        contexts,
        tags,
        bulkActionMode
    ) {

        if (bulkActionMode !== "ACTIVE") {

            const actionLabels = {
                COMPLETED:
                    "Reactivar selección",
                ARCHIVED:
                    "Restaurar selección",
                TRASH:
                    "Restaurar selección"
            };

            return `
                <section class="bulkToolbar">

                    <strong>
                        ${selectedCount}
                        ${selectedCount === 1
                            ? "tarea seleccionada"
                            : "tareas seleccionadas"}
                    </strong>

                    <button
                        id="bulkRestoreTasks"
                        type="button">
                        ${actionLabels[bulkActionMode]}
                    </button>

                    <button
                        id="clearBulkSelection"
                        type="button"
                        class="secondaryAction">
                        Cancelar selección
                    </button>

                </section>
            `;

        }

        const priorityOptions =
            PriorityOptions.map(option => `
                <option value="${option.value}">
                    ${escapeHtml(option.label)}
                </option>
            `).join("");

        const areaOptions =
            areas.map(area => `
                <option value="${escapeHtml(area.id)}">
                    ${escapeHtml(area.name)}
                </option>
            `).join("");

        const contextOptions =
            contexts.map(context => `
                <option value="${escapeHtml(context.id)}">
                    ${escapeHtml(context.name)}
                </option>
            `).join("");

        const tagOptions =
            tags.map(tag => `
                <label class="bulkTagOption">
                    <input
                        type="checkbox"
                        class="bulkTagCheckbox"
                        value="${escapeHtml(tag.id)}">
                    ${escapeHtml(tag.name)}
                </label>
            `).join("");

        return `
            <section class="bulkToolbar">

                <strong>
                    ${selectedCount}
                    ${selectedCount === 1
                        ? "tarea seleccionada"
                        : "tareas seleccionadas"}
                </strong>

                <div class="bulkControl">

                    <select
                        id="bulkPriority"
                        aria-label="Prioridad para las tareas seleccionadas">
                        <option value="">
                            No cambiar prioridad
                        </option>
                        ${priorityOptions}
                    </select>

                </div>

                <div class="bulkControl">

                    <input
                        id="bulkDueDate"
                        type="date"
                        aria-label="Fecha para las tareas seleccionadas">

                </div>

                <div class="bulkControl">

                    <select
                        id="bulkArea"
                        aria-label="Área para las tareas seleccionadas">
                        <option value="">
                            No cambiar área
                        </option>
                        <option value="__CLEAR__">
                            Quitar área
                        </option>
                        ${areaOptions}
                    </select>

                    <select
                        id="bulkContext"
                        aria-label="Contexto para las tareas seleccionadas">
                        <option value="">
                            No cambiar contexto
                        </option>
                        <option value="__CLEAR__">
                            Quitar contexto
                        </option>
                        ${contextOptions}
                    </select>

                </div>

                <div class="bulkTagControl">

                    <span>
                        Agregar etiquetas
                    </span>

                    <div
                        id="bulkTags"
                        class="bulkTagOptions">
                        ${tags.length > 0
                            ? tagOptions
                            : `
                                <small>
                                    No hay etiquetas disponibles.
                                </small>
                            `}
                    </div>

                </div>

                <button
                    id="applyBulkChanges"
                    type="button">
                    Aplicar cambios
                </button>

                <div class="bulkStateActions">

                    <button
                        id="bulkCompleteTasks"
                        type="button">
                        Completar
                    </button>

                    <button
                        id="bulkArchiveTasks"
                        type="button">
                        Archivar
                    </button>

                    <button
                        id="bulkDeleteTasks"
                        type="button"
                        class="dangerAction">
                        Enviar a papelera
                    </button>

                </div>

                <button
                    id="clearBulkSelection"
                    type="button"
                    class="secondaryAction">
                    Cancelar selección
                </button>

            </section>
        `;

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
