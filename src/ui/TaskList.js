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
        bulkActionMode = null,
        showTaskMetadata = true,
        today = ""
    ) {

        const form = allowCreate
            ? `
                <form id="taskForm">

                    <input
                        id="taskTitle"
                        type="text"
                        placeholder="Nueva tarea"
                        autocomplete="off"
                        autofocus>

                    <button type="submit">
                        Agregar
                    </button>

                    <button
                        id="cancelTaskCreation"
                        type="button"
                        class="secondaryAction">
                        Cancelar
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

                <div class="taskListHeading">

                    <h2>${escapeHtml(title)}</h2>

                    <button
                        id="toggleTaskMetadata"
                        type="button"
                        class="taskMetadataToggle">
                        ${showTaskMetadata
                            ? "Ocultar detalles"
                            : "Mostrar detalles"}
                    </button>

                </div>

                ${bulkSelectionEnabled
                    ? `
                        <p class="bulkModeNotice">
                            Modo de selección múltiple activo
                        </p>
                    `
                    : ""}

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

                if (
                    priority &&
                    priority.value !== 0 &&
                    (
                        showTaskMetadata ||
                        priority.value === 4
                    )
                ) {

                    metadata.push(`
                        <span
                            class="priorityIndicator priority-${priority.value}"
                            title="Prioridad: ${escapeHtml(priority.label)}"
                            aria-label="Prioridad: ${escapeHtml(priority.label)}">
                            ⚑
                        </span>
                    `);

                }

                const overdue =
                    task.dueDate &&
                    this.isOverdue(
                        task.dueDate,
                        today
                    );

                if (
                    task.dueDate &&
                    (
                        showTaskMetadata ||
                        overdue
                    )
                ) {

                    metadata.push(`
                        <span class="taskDueDate ${overdue ? "overdue" : ""}">
                            ${escapeHtml(
                                this.formatSmartDate(
                                    task.dueDate,
                                    today
                                )
                            )}
                        </span>
                    `);

                }

                if (
                    showTaskMetadata &&
                    area
                ) {

                    metadata.push(
                        this.renderMetadataChip(
                            area.name,
                            area.color,
                            "Área"
                        )
                    );

                }

                if (
                    showTaskMetadata &&
                    context
                ) {

                    metadata.push(
                        this.renderMetadataChip(
                            context.name,
                            context.color,
                            "Contexto"
                        )
                    );

                }

                const taskTags = task.tagIds
                    .map(tagId => tagsById.get(tagId))
                    .filter(Boolean);

                if (showTaskMetadata) {

                    for (const tag of taskTags) {

                        metadata.push(
                            this.renderMetadataChip(
                                tag.name,
                                tag.color,
                                "Etiqueta"
                            )
                        );

                    }

                }

                if (
                    showTaskMetadata &&
                    task.postponements.length > 0
                ) {

                    metadata.push(`
                        <span class="taskMetaText">
                            Pospuesta:
                            ${task.postponements.length}
                            ${task.postponements.length === 1
                                ? "vez"
                                : "veces"}
                        </span>
                    `);

                }

                const metadataHtml = metadata.length > 0
                    ? `
                        <div class="taskMeta">
                            ${metadata.join("")}
                        </div>
                    `
                    : "";

                html += `
                    <li
                        class="task ${depth > 0 ? "subtask" : ""} ${task.isCompleted() ? "completedTask" : ""} ${selectedTaskIds.has(task.id) ? "bulkSelectedTask" : ""}"
                        style="--task-depth:${depth}"
                        data-id="${escapeHtml(task.id)}">

                        <div class="taskHeader">

                            ${toggleHtml}

                            ${!bulkSelectionEnabled &&
                                bulkActionMode === "ACTIVE" &&
                                !task.isCompleted()
                                ? `
                                    <input
                                        type="checkbox"
                                        class="taskCompleteCheckbox"
                                        data-id="${escapeHtml(task.id)}"
                                        aria-label="Completar ${escapeHtml(task.title)}">
                                `
                                : ""}

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

                            <div class="taskBody">

                                <div class="taskTitleLine">

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

                            </div>

                        </div>

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

    renderMetadataChip(
        name,
        color,
        type
    ) {

        const safeColor = this.normalizeColor(color);

        const classes = {
            "Área": "taskMetaArea",
            "Contexto": "taskMetaContext",
            "Etiqueta": "taskMetaTag"
        };

        const prefixes = {
            "Área": "",
            "Contexto": "@",
            "Etiqueta": "#"
        };

        return `
            <span
                class="taskMetaEntity ${classes[type]}"
                title="${escapeHtml(type)}: ${escapeHtml(name)}"
                style="--meta-color: ${safeColor}">
                ${type === "Área"
                    ? `
                        <span
                            class="taskMetaColor"
                            aria-hidden="true">
                        </span>
                    `
                    : ""}
                ${prefixes[type]}${escapeHtml(name)}
            </span>
        `;

    }

    normalizeColor(color) {

        return /^#[0-9a-f]{6}$/i.test(color ?? "")
            ? color
            : "#64748b";

    }

    isOverdue(date, today) {

        return Boolean(
            today &&
            date < today
        );

    }

    formatSmartDate(date, today) {

        const reference =
            today || this.getTodayString();

        if (date === reference) {
            return "Hoy";
        }

        const difference =
            this.daysBetween(
                reference,
                date
            );

        if (difference === 1) {
            return "Mañana";
        }

        if (
            difference >= 2 &&
            difference <= 7
        ) {

            const value = new Date(
                `${date}T12:00:00`
            ).toLocaleDateString(
                "es-AR",
                { weekday: "long" }
            );

            return value.charAt(0).toUpperCase() +
                value.slice(1);

        }

        const [
            year,
            month,
            day
        ] = date.split("-");

        const currentYear =
            reference.split("-")[0];

        return year === currentYear
            ? `${day}/${month}`
            : `${day}/${month}/${year}`;

    }

    daysBetween(from, to) {

        const fromDate = new Date(
            `${from}T12:00:00Z`
        );

        const toDate = new Date(
            `${to}T12:00:00Z`
        );

        return Math.round(
            (toDate - fromDate) /
            86400000
        );

    }

    getTodayString() {

        const today = new Date();

        const year = today.getFullYear();
        const month = String(
            today.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            today.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }

}
