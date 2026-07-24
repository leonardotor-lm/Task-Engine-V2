import { PriorityOptions } from "./PriorityOptions.js";
import { escapeHtml } from "./escapeHtml.js";
import { RecurrenceFrequency } from "../domain/Recurrence.js";

export class TaskEditor {

    render(task, areas = [], contexts = [], tags = [], allTasks = []) {

        if (!task) {

            return `
                <aside class="details">
                    <h3>Editor</h3>
                    <p>Seleccioná una tarea.</p>
                </aside>
            `;

        }

        const isCompleted = task.isCompleted();
        const isArchived = task.isArchived();
        const isDeleted = task.isDeleted();

        const isLocked =
            isCompleted ||
            isArchived ||
            isDeleted;

        const disabled = isLocked
            ? "disabled"
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

        const tagOptions = tags.length > 0
            ? tags.map(tag => `

                <label class="tagOption">

                    <input
                        class="taskTag"
                        type="checkbox"
                        value="${escapeHtml(tag.id)}"
                        ${task.tagIds.includes(tag.id) ? "checked" : ""}
                        ${disabled}>

                    <span
                        class="tagColor"
                        style="background:${escapeHtml(tag.color)}">
                    </span>

                    ${escapeHtml(tag.name)}

                </label>

            `).join("")
            : `
                <span class="emptyTagMessage">
                    No hay etiquetas creadas.
                </span>
            `;

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

        const recurrenceIndicator = task.recurrence
            ? `
                <p class="recurrenceIndicator">
                    ↻ Recurrente: ${recurrenceLabels[task.recurrence]}
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
                            type="date"
                            min="${escapeHtml(task.dueDate)}">

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
                                ${subtask.isCompleted() ? "✓ " : ""}
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
                <button id="reopenTask">
                    Marcar pendiente
                </button>
            `;

        } else if (isArchived) {

            actions = `
                <button id="restoreArchivedTask">
                    Restaurar
                </button>

                <button id="deleteTask">
                    Mover a la papelera
                </button>
            `;

        } else if (isDeleted) {

            actions = `
                <button id="restoreDeletedTask">
                    Restaurar
                </button>

                <button id="permanentlyDeleteTask">
                    Eliminar definitivamente
                </button>
            `;

        } else {

            actions = `
                <button id="saveTask">
                    Guardar cambios
                </button>

                <button id="toggleTask">
                    Completar
                </button>

                <button id="archiveTask">
                    Archivar
                </button>

                <button id="deleteTask">
                    Eliminar
                </button>

                ${task.recurrence
                    ? `
                        <button id="skipRecurringTask">
                            Saltear esta vez
                        </button>
                    `
                    : ""}
            `;

        }

        return `
            <aside class="details">

                <h3>Editor</h3>

                ${recurrenceIndicator}

                <label>Título</label>

                <input
                    id="taskTitleEdit"
                    type="text"
                    value="${escapeHtml(task.title)}"
                    ${disabled}>

                <label>Descripción</label>

                <textarea
                    id="taskDescriptionEdit"
                    rows="6"
                    ${disabled}>${escapeHtml(task.description)}</textarea>

                <label>Área</label>

                <select
                    id="taskArea"
                    ${disabled}>

                    <option value="">
                        Sin área
                    </option>

                    ${areaOptions}

                </select>

                <label>Contexto</label>

                <select
                    id="taskContext"
                    ${disabled}>

                    <option value="">
                        Sin contexto
                    </option>

                    ${contextOptions}

                </select>

                <fieldset class="tagField" ${disabled}>

                    <legend>Etiquetas</legend>

                    ${tagOptions}

                </fieldset>

                <label>Prioridad</label>

                <select
                    id="taskPriority"
                    ${disabled}>
                    ${priorityOptions}
                </select>

                <label>Fecha de vencimiento</label>

                <input
                    id="taskDueDate"
                    type="date"
                    value="${escapeHtml(task.dueDate)}"
                    ${disabled}>

                <label>Repetir</label>

                <select
                    id="taskRecurrence"
                    ${disabled}>
                    ${recurrenceOptions}
                </select>

                ${postponementControls}
                ${postponementSummary}

                <section class="subtaskSection">

                    <h4>Subtareas</h4>

                    ${subtaskItems}
                    ${subtaskForm}

                </section>

                <hr>

                ${actions}

            </aside>
        `;

    }

}