import { PriorityOptions } from "./PriorityOptions.js";
import { escapeHtml } from "./escapeHtml.js";

export class TaskEditor {

    render(task, areas = [], contexts = [], tags = []) {

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
            `;

        }

        return `
            <aside class="details">

                <h3>Editor</h3>

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

                <hr>

                ${actions}

            </aside>
        `;

    }

}