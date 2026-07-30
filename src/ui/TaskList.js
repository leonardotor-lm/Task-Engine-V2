import { PriorityOptions } from "./PriorityOptions.js";
import { escapeHtml } from "./escapeHtml.js";
import { flattenTaskTree } from "../core/TaskTree.js";
import {
    SearchableMultiSelect
} from "./SearchableMultiSelect.js";
import { Icon } from "./Icon.js";

export class TaskList {

    constructor() {
        this.searchableMultiSelect =
            new SearchableMultiSelect();
    }

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
        today = "",
        allTasks = tasks,
        headingActions = "",
        creationPlaceholder = "Nueva tarea",
        inlineSubtaskParentId = null,
        contentBeforeList = "",
        goals = [],
        contentClass = ""
    ) {

        const form = allowCreate
            ? `
                <form id="taskForm">

                    <input
                        id="taskTitle"
                        type="text"
                        placeholder="${escapeHtml(creationPlaceholder)}"
                        autocomplete="off"
                        autofocus>

                    <button
                        type="submit"
                        class="primaryAction">
                        Agregar
                    </button>

                    <button
                        id="cancelTaskCreation"
                        type="button"
                        class="tertiaryAction">
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
            <main class="content ${escapeHtml(contentClass)}">

                <div class="taskListHeading">

                    <h2>${escapeHtml(title)}</h2>

                    <div class="taskListHeadingActions">

                        ${headingActions}

                    </div>

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
                        goals,
                        bulkActionMode
                    )
                    : ""}

                ${form}

                ${contentBeforeList}
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

                const visibleChildren =
                    childrenByParent.get(task.id) ?? [];

                const allChildren = allTasks.filter(
                    item => {

                        if (
                            item.parentTaskId !== task.id
                        ) {
                            return false;
                        }

                        return task.isDeleted()
                            ? item.isDeleted()
                            : !item.isDeleted();

                    }
                );

                const totalSubtasks =
                    allChildren.length;

                const completedSubtasks =
                    allChildren.filter(
                        child => child.isCompleted()
                    ).length;

                const hasSubtasks =
                    visibleChildren.length > 0;

                const hasAnySubtasks =
                    totalSubtasks > 0;

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
                            ${Icon.render(
                                isExpanded
                                    ? "chevron-down"
                                    : "chevron-right",
                                "treeToggleIcon"
                            )}
                        </button>
                    `
                    : `
                        <span class="toggleSubtasksSpacer"></span>
                    `;

                const progressHtml = hasAnySubtasks
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

                const canAddSubtask =
                    !bulkSelectionEnabled &&
                    !task.isCompleted() &&
                    !task.isArchived() &&
                    !task.isDeleted() &&
                    !task.recurrence;

                const canQuickPostpone =
                    !bulkSelectionEnabled &&
                    !task.isCompleted() &&
                    !task.isArchived() &&
                    !task.isDeleted() &&
                    !task.recurrence &&
                    Boolean(task.dueDate);

                const canShowQuickMenu =
                    !bulkSelectionEnabled &&
                    !task.isCompleted() &&
                    !task.isArchived() &&
                    !task.isDeleted();

                const hasActiveDescendants =
                    allTasks.some(
                        item =>
                            item.parentTaskId ===
                                task.id &&
                            !item.isCompleted() &&
                            !item.isArchived() &&
                            !item.isDeleted()
                    );

                const canQuickArchive =
                    canShowQuickMenu &&
                    !hasActiveDescendants;

                const postponeBaseDate =
                    task.dueDate > today
                        ? task.dueDate
                        : today;

                const postponeOneDay =
                    canQuickPostpone
                        ? this.addDays(
                            postponeBaseDate,
                            1
                        )
                        : "";

                const postponeOneWeek =
                    canQuickPostpone
                        ? this.addDays(
                            postponeBaseDate,
                            7
                        )
                        : "";

                const minimumPostponeDate =
                    canQuickPostpone
                        ? this.addDays(
                            task.dueDate,
                            1
                        )
                        : "";

                const inlineSubtaskForm =
                    inlineSubtaskParentId === task.id
                        ? `
                            <form
                                class="inlineSubtaskForm"
                                data-parent-id="${escapeHtml(task.id)}">

                                <input
                                    class="inlineSubtaskTitle"
                                    type="text"
                                    placeholder="Nueva subtarea"
                                    autocomplete="off"
                                    aria-label="Título de la nueva subtarea"
                                    autofocus>

                                <button
                                    type="submit"
                                    class="primaryAction">
                                    Agregar
                                </button>

                                <button
                                    type="button"
                                    class="cancelInlineSubtask secondaryAction">
                                    Cancelar
                                </button>

                            </form>
                        `
                        : "";

                html += `
                    <li
                        class="task ${depth > 0 ? "subtask" : ""} ${hasAnySubtasks ? "projectTask" : ""} ${task.isCompleted() ? "completedTask" : ""} ${selectedTaskIds.has(task.id) ? "bulkSelectedTask" : ""}"
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
                                        ${task.parentTaskId
                                            ? `
                                                <span
                                                    class="hierarchyIcon childTaskIcon"
                                                    title="Subtarea"
                                                    aria-label="Subtarea">
                                                    ↳
                                                </span>
                                            `
                                            : ""}
                                        ${task.recurrence
                                            ? `<span
                                                class="recurrenceIcon"
                                                title="Tarea recurrente"
                                                aria-label="Tarea recurrente">
                                                ${Icon.render(
                                                    "repeat",
                                                    "taskStatusIcon"
                                                )}
                                            </span>`
                                            : ""}
                                        ${escapeHtml(task.title)}
                                    </span>

                                    ${progressHtml}

                                    ${canAddSubtask ||
                                        canQuickPostpone ||
                                        canShowQuickMenu
                                        ? `
                                            <span class="taskQuickActions">

                                                ${canAddSubtask
                                                    ? `
                                                        <button
                                                            type="button"
                                                            class="quickAddSubtask"
                                                            data-id="${escapeHtml(task.id)}"
                                                            title="Agregar subtarea"
                                                            aria-label="Agregar subtarea a ${escapeHtml(task.title)}">
                                                            ${Icon.render(
                                                                "plus",
                                                                "quickActionIcon"
                                                            )}
                                                        </button>
                                                    `
                                                    : ""}

                                                ${canQuickPostpone
                                                    ? `
                                                        <details
                                                            class="quickPostpone"
                                                            data-id="${escapeHtml(task.id)}">

                                                            <summary
                                                                title="Posponer"
                                                                aria-label="Posponer ${escapeHtml(task.title)}">
                                                                ${Icon.render(
                                                                    "clock",
                                                                    "quickActionIcon"
                                                                )}
                                                            </summary>

                                                            <div class="quickPostponeMenu">

                                                                <button
                                                                    type="button"
                                                                    class="quickPostponePreset"
                                                                    data-date="${postponeOneDay}">
                                                                    Posponer 1 día
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    class="quickPostponePreset"
                                                                    data-date="${postponeOneWeek}">
                                                                    Posponer 1 semana
                                                                </button>

                                                                <label>
                                                                    Elegir fecha

                                                                    <input
                                                                        type="date"
                                                                        class="quickPostponeDate"
                                                                        min="${minimumPostponeDate}">
                                                                </label>

                                                                <button
                                                                    type="button"
                                                                    class="applyQuickPostpone">
                                                                    Aplicar
                                                                </button>

                                                            </div>

                                                        </details>
                                                    `
                                                    : ""}

                                                ${canShowQuickMenu
                                                    ? `
                                                        <details
                                                            class="quickMoreActions"
                                                            data-id="${escapeHtml(task.id)}">

                                                            <summary
                                                                title="Más acciones"
                                                                aria-label="Más acciones para ${escapeHtml(task.title)}">
                                                                ${Icon.render(
                                                                    "more",
                                                                    "quickActionIcon"
                                                                )}
                                                            </summary>

                                                            <div class="quickMoreMenu">

                                                                <div class="quickActionsSheetHeader">
                                                                    <strong>Acciones</strong>

                                                                    <button
                                                                        type="button"
                                                                        class="closeQuickActions iconButton"
                                                                        aria-label="Cerrar acciones"
                                                                        title="Cerrar acciones">
                                                                        ${Icon.render(
                                                                            "close"
                                                                        )}
                                                                    </button>
                                                                </div>

                                                                ${canAddSubtask
                                                                    ? `
                                                                        <button
                                                                            type="button"
                                                                            class="quickAddSubtask mobileQuickMenuAction"
                                                                            data-id="${escapeHtml(task.id)}">
                                                                            Agregar subtarea
                                                                        </button>
                                                                    `
                                                                    : ""}

                                                                ${canQuickPostpone
                                                                    ? `
                                                                        <details
                                                                            class="quickPostpone mobileQuickPostpone"
                                                                            data-id="${escapeHtml(task.id)}">

                                                                            <summary>
                                                                                Posponer
                                                                            </summary>

                                                                            <div class="quickPostponeMenu">

                                                                                <button
                                                                                    type="button"
                                                                                    class="quickPostponePreset"
                                                                                    data-date="${postponeOneDay}">
                                                                                    Posponer 1 día
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    class="quickPostponePreset"
                                                                                    data-date="${postponeOneWeek}">
                                                                                    Posponer 1 semana
                                                                                </button>

                                                                                <label>
                                                                                    Elegir fecha

                                                                                    <input
                                                                                        type="date"
                                                                                        class="quickPostponeDate"
                                                                                        min="${minimumPostponeDate}">
                                                                                </label>

                                                                                <button
                                                                                    type="button"
                                                                                    class="applyQuickPostpone">
                                                                                    Aplicar
                                                                                </button>

                                                                            </div>

                                                                        </details>
                                                                    `
                                                                    : ""}

                                                                ${task.recurrence
                                                                    ? `
                                                                        <button
                                                                            type="button"
                                                                            class="quickEditTask">
                                                                            Editar
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            class="quickSkipRecurringTask">
                                                                            Saltear esta vez
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            class="quickEndRecurrence">
                                                                            Finalizar recurrencia
                                                                        </button>
                                                                    `
                                                                    : ""}

                                                                ${canQuickArchive
                                                                    ? `
                                                                        <button
                                                                            type="button"
                                                                            class="quickArchiveTask">
                                                                            Archivar
                                                                        </button>
                                                                    `
                                                                    : ""}

                                                                <button
                                                                    type="button"
                                                                    class="quickDeleteTask destructiveAction">
                                                                    Enviar a Papelera
                                                                </button>

                                                                ${!task.recurrence
                                                                    ? `
                                                                        <div
                                                                            class="quickMoreMenuDivider"
                                                                            aria-hidden="true">
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            class="quickDuplicateTask">
                                                                            Duplicar
                                                                        </button>
                                                                    `
                                                                    : ""}

                                                            </div>

                                                        </details>
                                                    `
                                                    : ""}

                                            </span>
                                        `
                                        : ""}

                                </div>

                                ${metadataHtml}

                            </div>

                        </div>

                        ${inlineSubtaskForm}

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

    isDescendantOf(
        taskId,
        ancestorId,
        tasks
    ) {

        const tasksById = new Map(
            tasks.map(
                task => [task.id, task]
            )
        );

        const visited = new Set();
        let current =
            tasksById.get(taskId);

        while (
            current?.parentTaskId &&
            !visited.has(current.id)
        ) {

            if (
                current.parentTaskId ===
                ancestorId
            ) {
                return true;
            }

            visited.add(current.id);

            current = tasksById.get(
                current.parentTaskId
            );

        }

        return false;

    }

    addDays(dateString, days) {

        const date = new Date(
            `${dateString}T12:00:00`
        );

        date.setDate(
            date.getDate() + days
        );

        const year = date.getFullYear();
        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;

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
        goals,
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

                    ${bulkActionMode === "TRASH"
                        ? `
                            <button
                                id="bulkPermanentlyDeleteTasks"
                                type="button"
                                class="dangerAction">
                                Eliminar definitivamente
                            </button>
                        `
                        : ""}

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
            tags.map(tag => ({
                value: tag.id,
                label: tag.name,
                color: tag.color
            }));

        const goalOptions =
            goals
                .filter(goal =>
                    goal.status !== "DELETED" &&
                    goal.status !== "ARCHIVED"
                )
                .map(goal => ({
                    value: goal.id,
                    label: goal.title
                }));

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

                <div
                    id="bulkTags"
                    class="bulkTagControl">

                    ${this.searchableMultiSelect.render({
                        id: "bulkTagPicker",
                        label: "Agregar etiquetas",
                        options: tagOptions,
                        selectedValues: [],
                        valueClass:
                            "bulkTagCheckbox",
                        emptyMessage:
                            "No hay etiquetas disponibles.",
                        compact: true,
                        managerLabel:
                            "Agregar etiquetas"
                    })}

                </div>

                <div
                    id="bulkGoals"
                    class="bulkTagControl bulkGoalControl">

                    ${this.searchableMultiSelect.render({
                        id: "bulkGoalPicker",
                        label: "Agregar objetivos",
                        options: goalOptions,
                        selectedValues: [],
                        valueClass:
                            "bulkGoalInput",
                        emptyMessage:
                            "No hay objetivos disponibles.",
                        compact: true,
                        managerLabel:
                            "Agregar objetivos"
                    })}

                </div>

                <button
                    id="applyBulkChanges"
                    type="button"
                    class="bulkPrimaryAction">
                    Aplicar cambios
                </button>

                <details class="bulkMoreActions">

                    <summary>
                        Más acciones
                    </summary>

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

                </details>

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
