import { escapeHtml } from "./escapeHtml.js";

export class TaskDetails {

    render(task, areas = []) {

        if (!task) {

            return `
                <aside class="details">
                    <h3>Detalle</h3>
                    <p>Seleccioná una tarea.</p>
                </aside>
            `;

        }

        const options = areas.map(area => `

            <option
                value="${escapeHtml(area.id)}"
                ${task.areaId === area.id ? "selected" : ""}>
                ${escapeHtml(area.name)}
            </option>

        `).join("");

        return `
            <aside class="details">

                <h3>Detalle</h3>

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

                    ${options}

                </select>

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