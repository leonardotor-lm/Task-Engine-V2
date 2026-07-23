import { PriorityOptions } from "./PriorityOptions.js";
import { escapeHtml } from "./escapeHtml.js";

export class TaskEditor {

    render(task, areas = [], contexts = []) {

        if (!task) {

            return `
                <aside class="details">
                    <h3>Editor</h3>
                    <p>Seleccioná una tarea.</p>
                </aside>
            `;

        }

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

        const priorityOptions = PriorityOptions.map(option => `

            <option
                value="${option.value}"
                ${task.priority === option.value ? "selected" : ""}>
                ${escapeHtml(option.label)}
            </option>

        `).join("");

        return `
            <aside class="details">

                <h3>Editor</h3>

                <label>Título</label>

                <input
                    id="taskTitleEdit"
                    type="text"
                    value="${escapeHtml(task.title)}">

                <label>Descripción</label>

                <textarea
                    id="taskDescriptionEdit"
                    rows="6">${escapeHtml(task.description)}</textarea>

                <label>Área</label>

                <select id="taskArea">

                    <option value="">
                        Sin área
                    </option>

                    ${areaOptions}

                </select>

                <label>Contexto</label>

                <select id="taskContext">

                    <option value="">
                        Sin contexto
                    </option>

                    ${contextOptions}

                </select>

                <label>Prioridad</label>

                <select id="taskPriority">
                    ${priorityOptions}
                </select>

                <label>Fecha de vencimiento</label>

                <input
                    id="taskDueDate"
                    type="date"
                    value="${escapeHtml(task.dueDate)}">

                <hr>

                <button id="saveTask">
                    Guardar cambios
                </button>

                <button id="toggleTask">
                    ${task.isCompleted()
                        ? "Marcar pendiente"
                        : "Completar"}
                </button>

            </aside>
        `;

    }

}