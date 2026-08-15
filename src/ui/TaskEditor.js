import { PriorityOptions } from "./PriorityOptions.js";
import { escapeHtml } from "./escapeHtml.js";
import {
    SearchableMultiSelect
} from "./SearchableMultiSelect.js";
import { SearchableSelect } from "./SearchableSelect.js";
import { Icon } from "./Icon.js";
import {
    RecurrenceFrequency,
    RecurrenceWeekday
} from "../domain/Recurrence.js";

export class TaskEditor {

    constructor() {
        this.searchableMultiSelect =
            new SearchableMultiSelect();
        this.searchableSelect =
            new SearchableSelect();
    }

    render(
        task,
        areas = [],
        contexts = [],
        tags = [],
        allTasks = [],
        goals = []
    ) {

        if (!task) {
            return "";
        }

        const isCompleted = task.isCompleted();
        const isArchived = task.isArchived();
        const isDeleted = task.isDeleted();

        if (isArchived) {
            return this.renderArchivedPanel(task);
        }

        if (isDeleted) {
            return this.renderDeletedPanel(task);
        }

        const isLocked =
            isCompleted ||
            isArchived ||
            isDeleted;

        const disabled = isLocked
            ? "disabled"
            : "";

        const parentTask = task.parentTaskId
            ? allTasks.find(
                item => item.id === task.parentTaskId
            ) ?? null
            : null;

        const parentContext = task.parentTaskId
            ? `
                <div class="taskParentContext">
                    ${Icon.render(
                        "corner-down-right",
                        "taskParentContextIcon"
                    )}
                    <span>Subtarea de:</span>
                    ${parentTask
                        ? `
                            <button
                                id="openParentTask"
                                type="button"
                                data-id="${escapeHtml(parentTask.id)}"
                                title="Abrir ${escapeHtml(parentTask.title)}">
                                ${escapeHtml(parentTask.title)}
                            </button>
                        `
                        : `
                            <span class="missingParentTask">
                                Tarea padre no disponible
                            </span>
                        `}
                </div>
            `
            : "";

        const areaOptions = areas.map(area => `

            <option
                value="${escapeHtml(area.id)}"
                ${task.areaId === area.id ? "selected" : ""}>
                ${escapeHtml(area.name)}
            </option>

        `).join("");

        const contextOptions = contexts.map(context => `

            <option
                value="${escapeHtml(context.id)}"
                ${task.contextId === context.id ? "selected" : ""}>
                ${escapeHtml(context.name)}
            </option>

        `).join("");

        const tagOptions = tags.map(tag => ({
            value: tag.id,
            label: tag.name,
            color: tag.color
        }));

        const goalOptions = goals
            .filter(goal =>
                goal.status !== "DELETED" &&
                goal.status !== "ARCHIVED"
            );

        const goalOptionItems =
            goalOptions.map(goal => ({
                value: goal.id,
                label: goal.title
            }));
        const visibleGoalIds = new Set(
            goalOptionItems.map(
                option => String(option.value)
            )
        );
        const preservedGoalInputs = [
            ...(task.goalIds ?? [])
        ]
            .filter(
                id => !visibleGoalIds.has(String(id))
            )
            .map(id => `
                <input
                    type="hidden"
                    class="taskGoal taskGoalPreserved"
                    value="${escapeHtml(id)}">
            `)
            .join("");

        const descendantIds =
            this.getDescendantIds(
                task.id,
                allTasks
            );

        const moveTargets = !isLocked &&
            !task.recurrence
            ? allTasks.filter(candidate =>
                candidate.id !== task.id &&
                candidate.id !== task.parentTaskId &&
                !descendantIds.has(candidate.id) &&
                !candidate.isCompleted() &&
                !candidate.isArchived() &&
                !candidate.isDeleted() &&
                !candidate.recurrence
            )
            : [];

        const moveOptions = [
            ...(task.parentTaskId
                ? [{
                    value: "__ROOT__",
                    label:
                        "Convertir en tarea principal"
                }]
                : []),
            ...moveTargets.map(candidate => ({
                value: candidate.id,
                label: candidate.title
            }))
        ];

        const priorityOptions = PriorityOptions.map(option => `

            <option
                value="${option.value}"
                ${task.priority === option.value ? "selected" : ""}>
                ${escapeHtml(option.label)}
            </option>

        `).join("");

        const recurrenceOptions = [
            {
                value: "",
                label: "Sin recurrencia"
            },
            {
                value: RecurrenceFrequency.DAILY,
                label: "Diaria"
            },
            {
                value: RecurrenceFrequency.WEEKLY,
                label: "Semanal"
            },
            {
                value: RecurrenceFrequency.MONTHLY,
                label: "Mensual"
            }
        ].map(option => `

            <option
                value="${option.value}"
                ${task.recurrence === option.value ||
                    (!task.recurrence && option.value === "")
                        ? "selected"
                        : ""}>
                ${option.label}
            </option>

        `).join("");

        const recurrenceLabels = {
            [RecurrenceFrequency.DAILY]: "Diaria",
            [RecurrenceFrequency.WEEKLY]: "Semanal",
            [RecurrenceFrequency.MONTHLY]: "Mensual"
        };

        const recurrenceWeekdayOptions = [
            {
                value:
                    RecurrenceWeekday.MONDAY,
                label: "L"
            },
            {
                value:
                    RecurrenceWeekday.TUESDAY,
                label: "M"
            },
            {
                value:
                    RecurrenceWeekday.WEDNESDAY,
                label: "X"
            },
            {
                value:
                    RecurrenceWeekday.THURSDAY,
                label: "J"
            },
            {
                value:
                    RecurrenceWeekday.FRIDAY,
                label: "V"
            },
            {
                value:
                    RecurrenceWeekday.SATURDAY,
                label: "S"
            },
            {
                value:
                    RecurrenceWeekday.SUNDAY,
                label: "D"
            }
        ].map(option => `

            <label class="recurrenceWeekdayOption">

                <input
                    class="taskRecurrenceWeekday"
                    type="checkbox"
                    value="${option.value}"
                    ${task.recurrenceWeekdays
                        .includes(option.value)
                        ? "checked"
                        : ""}
                    ${disabled}>

                <span>
                    ${option.label}
                </span>

            </label>

        `).join("");

        const recurrenceIndicator = task.recurrence
            ? `
                <p class="recurrenceIndicator">
                    ${Icon.render(
                        "repeat",
                        "inlineStatusIcon"
                    )}
                    Recurrente: ${recurrenceLabels[task.recurrence]}
                </p>
            `
            : "";

        const postponementCount = task.postponements.length;

        const postponementControls = (
            !isLocked &&
            task.dueDate &&
            !task.recurrence
        )
            ? `
                <div class="postponeControls">

                    <label for="postponeDate">
                        Posponer hasta
                    </label>

                    <div>

                        <input
                            id="postponeDate"
                            type="date">

                        <button
                            id="postponeTask"
                            type="button">
                            Posponer
                        </button>

                    </div>

                </div>
            `
            : "";

        const postponementSummary = postponementCount > 0
            ? `
                <p class="postponementSummary">
                    Pospuesta ${postponementCount}
                    ${postponementCount === 1 ? "vez" : "veces"}.
                </p>
            `
            : "";

        const directSubtasks = allTasks.filter(item => {

            if (item.parentTaskId !== task.id) {
                return false;
            }

            return isDeleted
                ? item.isDeleted()
                : !item.isDeleted();

        });

        const subtaskItems = directSubtasks.length > 0
            ? `
                <ul class="editorSubtaskList">
                    ${directSubtasks.map(subtask => `
                        <li>
                            <button
                                type="button"
                                class="subtaskLink ${subtask.isCompleted() ? "completedSubtaskLink" : ""}"
                                data-id="${escapeHtml(subtask.id)}">
                                ${subtask.isCompleted()
                                    ? Icon.render(
                                        "check",
                                        "inlineStatusIcon"
                                    )
                                    : ""}
                                ${escapeHtml(subtask.title)}
                            </button>
                        </li>
                    `).join("")}
                </ul>
            `
            : `
                <p class="emptyTagMessage">
                    No hay subtareas.
                </p>
            `;

        const subtaskForm = isLocked
            ? ""
            : `
                <form id="subtaskForm" class="subtaskForm">

                    <input
                        id="subtaskTitle"
                        type="text"
                        placeholder="Nueva subtarea"
                        autocomplete="off">

                    <button type="submit">
                        Agregar
                    </button>

                </form>
            `;

        let actions = "";

        if (isCompleted) {

            actions = `
                <button
                    id="reopenTask"
                    class="primaryAction">
                    Marcar pendiente
                </button>
            `;

        } else if (isArchived) {

            actions = `
                <button
                    id="restoreArchivedTask"
                    class="primaryAction">
                    Restaurar
                </button>

                <button
                    id="deleteTask"
                    class="dangerAction">
                    Mover a la papelera
                </button>
            `;

        } else if (isDeleted) {

            actions = `
                <button
                    id="restoreDeletedTask"
                    class="primaryAction">
                    Restaurar
                </button>

                <button
                    id="permanentlyDeleteTask"
                    class="dangerAction">
                    Eliminar definitivamente
                </button>
            `;

        } else {

            actions = `
                <button
                    id="saveTask"
                    class="primaryAction">
                    Guardar cambios
                </button>

                <button
                    id="toggleTask"
                    class="secondaryAction">
                    Completar
                </button>

                <button
                    id="archiveTask"
                    class="tertiaryAction">
                    Archivar
                </button>

                <button
                    id="deleteTask"
                    class="dangerAction">
                    Eliminar
                </button>

                ${task.recurrence
                    ? `
                        <button
                            id="skipRecurringTask"
                            class="tertiaryAction">
                            Saltear esta vez
                        </button>
                    `
                    : ""}
            `;

        }

        const mobileSaveAction =
            !isLocked
                ? `
                    <button
                        id="saveTaskMobile"
                        type="button"
                        class="mobileEditorSave iconButton"
                        aria-label="Guardar cambios"
                        title="Guardar cambios">
                        ${Icon.render("save")}
                    </button>
                `
                : "";

        return `
            <button
                id="taskEditorBackdrop"
                type="button"
                class="taskEditorBackdrop"
                aria-label="Cerrar editor de tarea"
                tabindex="-1">
            </button>

            <aside
                class="details taskDrawer"
                aria-label="Editor de tarea">

                <div class="taskEditorHeader">

                    <button
                        id="closeTaskEditor"
                        type="button"
                        aria-label="Cerrar editor"
                        title="Cerrar editor">
                        <span class="desktopCloseSymbol">
                            ${Icon.render("close")}
                        </span>
                        <span class="mobileBackSymbol">
                            ${Icon.render("back")}
                        </span>
                    </button>

                    <h3>Editar tarea</h3>

                    ${mobileSaveAction}

                </div>

                ${parentContext}

                <details
                    class="editorSection editorPrimarySection"
                    open>

                    <summary>
                        Información principal
                    </summary>

                    <div class="editorSectionBody">

                        <label for="taskTitleEdit">
                            Título
                        </label>

                        <input
                            id="taskTitleEdit"
                            type="text"
                            value="${escapeHtml(task.title)}"
                            ${disabled}>

                        <label for="taskDescriptionEdit">
                            Descripción
                        </label>

                        <textarea
                            id="taskDescriptionEdit"
                            rows="4"
                            ${disabled}>${escapeHtml(task.description)}</textarea>

                        <label for="taskPriority">
                            Prioridad
                        </label>

                        <select
                            id="taskPriority"
                            ${disabled}>
                            ${priorityOptions}
                        </select>

                        <label for="taskStartDate">
                            Fecha de inicio
                        </label>

                        <input
                            id="taskStartDate"
                            type="date"
                            value="${escapeHtml(task.startDate)}"
                            ${disabled}>

                        <label for="taskDueDate">
                            Fecha de vencimiento
                        </label>

                        <input
                            id="taskDueDate"
                            type="date"
                            value="${escapeHtml(task.dueDate)}"
                            ${disabled}>

                        <label for="taskDueTime">
                            Hora de vencimiento (opcional)
                        </label>

                        <input
                            id="taskDueTime"
                            type="time"
                            value="${escapeHtml(task.dueTime)}"
                            ${!task.dueDate ? "disabled" : ""}
                            ${disabled}>

                        <label
                            class="projectTaskControl"
                            for="taskIsProject">
                            <input
                                id="taskIsProject"
                                type="checkbox"
                                ${task.isProject || directSubtasks.length > 0
                                    ? "checked"
                                    : ""}
                                ${isLocked || directSubtasks.length > 0 || task.recurrence
                                    ? "disabled"
                                    : ""}>
                            <span>Proyecto</span>
                        </label>

                        <p class="fieldHelp projectTaskHelp">
                            Se mantiene en la vista Proyectos aunque no tenga subtareas.
                        </p>

                    </div>

                </details>

                <details
                    class="editorSection editorSecondarySection"
                    data-mobile-collapsed="true">

                    <summary>
                        Organización
                    </summary>

                    <div class="editorSectionBody">

                        <label for="taskArea">
                            Área
                        </label>

                        <select
                            id="taskArea"
                            ${disabled}>

                            <option value="">
                                Sin área
                            </option>

                            ${areaOptions}

                        </select>

                        <label for="taskContext">
                            Contexto
                        </label>

                        <select
                            id="taskContext"
                            ${disabled}>

                            <option value="">
                                Sin contexto
                            </option>

                            ${contextOptions}

                        </select>

                        ${this.searchableMultiSelect.render({
                            id: "taskTags",
                            label: "Etiquetas",
                            options: tagOptions,
                            selectedValues: task.tagIds,
                            valueClass: "taskTag",
                            emptyMessage:
                                "No hay etiquetas creadas.",
                            disabled: isLocked
                        })}

                        ${this.searchableMultiSelect.render({
                            id: "taskGoals",
                            label: "Objetivos",
                            options: goalOptionItems,
                            selectedValues:
                                task.goalIds ?? [],
                            valueClass: "taskGoal",
                            emptyMessage:
                                "No hay objetivos activos.",
                            disabled: isLocked
                        })}

                        ${preservedGoalInputs}

                        ${moveOptions.length > 0
                            ? `
                                <fieldset class="taskMoveField">
                                    <legend>
                                        Mover
                                    </legend>

                                    <details class="taskMoveManager">
                                        <summary>
                                            Elegir destino
                                        </summary>

                                        <div class="taskMoveManagerBody">
                                            ${this.searchableSelect.render({
                                                id: "taskMoveTarget",
                                                label:
                                                    "Proyecto de destino",
                                                options: moveOptions,
                                                placeholder:
                                                    "Buscar proyecto…"
                                            })}

                                            <button
                                                id="moveTaskFromEditor"
                                                type="button">
                                                Mover
                                            </button>
                                        </div>
                                    </details>
                                </fieldset>
                            `
                            : ""}

                    </div>

                </details>

                <details
                    class="editorSection editorSecondarySection"
                    data-mobile-collapsed="true">

                    <summary>
                        Planificación
                    </summary>

                    <div class="editorSectionBody">

                        ${recurrenceIndicator}

                        <label for="taskRecurrence">
                            Repetir
                        </label>

                        <select
                            id="taskRecurrence"
                            ${disabled}>
                            ${recurrenceOptions}
                        </select>

                        <div
                            id="recurrenceAdvancedFields"
                            class="recurrenceAdvancedFields"
                            ${task.recurrence
                                ? ""
                                : "hidden"}>

                            <label for="taskRecurrenceInterval">
                                Repetir cada
                            </label>

                            <div class="recurrenceIntervalControl">

                                <input
                                    id="taskRecurrenceInterval"
                                    type="number"
                                    min="1"
                                    max="365"
                                    value="${task.recurrenceInterval ?? 1}"
                                    ${disabled}>

                                <span id="recurrenceIntervalUnit">
                                    unidad
                                </span>

                            </div>

                            <fieldset
                                id="recurrenceWeekdays"
                                class="recurrenceWeekdays"
                                ${task.recurrence ===
                                    RecurrenceFrequency.WEEKLY
                                    ? ""
                                    : "hidden"}
                                ${disabled}>

                                <legend>
                                    Días de la semana
                                </legend>

                                <div>
                                    ${recurrenceWeekdayOptions}
                                </div>

                            </fieldset>

                        </div>

                        ${postponementControls}
                        ${postponementSummary}

                        ${!isLocked
                            ? `
                                <div class="recurrenceDialogActions">
                                    <button
                                        id="saveRecurrence"
                                        type="button"
                                        class="primaryAction">
                                        Guardar
                                    </button>

                                    <button
                                        id="cancelRecurrence"
                                        type="button"
                                        class="tertiaryAction">
                                        Cancelar
                                    </button>
                                </div>
                            `
                            : ""}

                    </div>

                </details>

                <details
                    class="editorSection editorSubtasksSection"
                    open>

                    <summary>
                        Subtareas
                    </summary>

                    <div class="editorSectionBody">

                        ${subtaskItems}
                        ${subtaskForm}

                    </div>

                </details>

                <hr>

                <div class="taskEditorActions">
                    ${actions}
                </div>

            </aside>
        `;

    }

    bindClassificationSelectors() {

        this.searchableMultiSelect.bind(
            "taskTags"
        );
        this.searchableMultiSelect.bind(
            "taskGoals"
        );
        this.searchableSelect.bind(
            "taskMoveTarget"
        );

    }

    getDescendantIds(taskId, tasks) {

        const result = new Set();
        const pending = [taskId];

        while (pending.length > 0) {

            const parentId = pending.shift();

            for (const task of tasks) {
                if (
                    task.parentTaskId === parentId &&
                    !result.has(task.id)
                ) {
                    result.add(task.id);
                    pending.push(task.id);
                }
            }

        }

        return result;

    }


    renderArchivedPanel(task) {

        return `
            <button
                id="taskEditorBackdrop"
                type="button"
                class="taskEditorBackdrop"
                aria-label="Cerrar editor de tarea"
                tabindex="-1">
            </button>

            <aside
                class="details taskDrawer recoveryPanel"
                aria-label="Acciones para tarea archivada">

                <div class="taskEditorHeader">

                    <h3>Archivada</h3>

                    <button
                        id="closeTaskEditor"
                        type="button"
                        aria-label="Cerrar panel"
                        title="Cerrar panel">
                        ${Icon.render("close")}
                    </button>

                </div>

                <p class="recoveryTaskTitle">
                    ${escapeHtml(task.title)}
                </p>

                <p>
                    Esta tarea no puede editarse mientras permanezca archivada.
                </p>

                <button
                    id="restoreArchivedTask"
                    class="primaryAction">
                    Reactivar
                </button>

                <button
                    id="deleteTask"
                    class="dangerAction">
                    Enviar a Papelera
                </button>

            </aside>
        `;

    }

    renderDeletedPanel(task) {

        return `
            <button
                id="taskEditorBackdrop"
                type="button"
                class="taskEditorBackdrop"
                aria-label="Cerrar editor de tarea"
                tabindex="-1">
            </button>

            <aside
                class="details taskDrawer recoveryPanel"
                aria-label="Acciones para tarea borrada">

                <div class="taskEditorHeader">

                    <h3>Papelera</h3>

                    <button
                        id="closeTaskEditor"
                        type="button"
                        aria-label="Cerrar panel"
                        title="Cerrar panel">
                        ${Icon.render("close")}
                    </button>

                </div>

                <p class="recoveryTaskTitle">
                    ${escapeHtml(task.title)}
                </p>

                <p>
                    Esta tarea fue enviada a Papelera.
                </p>

                <button
                    id="restoreDeletedTask"
                    class="primaryAction">
                    Restaurar
                </button>

                <button
                    id="permanentlyDeleteTask"
                    class="dangerAction">
                    Eliminar definitivamente
                </button>

            </aside>
        `;

    }

}
