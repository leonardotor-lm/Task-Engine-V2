export class TaskDetails {

    render(task, areas) {

        if (!task) {

            return `
                <aside class="details">
                    <h3>Detalle</h3>
                    <p>Seleccioná una tarea.</p>
                </aside>
            `;

        }

        return `
            <aside class="details">

                <h3>Detalle</h3>

                <label>Título</label>

                <input
                    id="taskTitleEdit"
                    type="text"
                    value="${task.title}">

                <label>Descripción</label>

                <textarea
                    id="taskDescriptionEdit"
                    rows="6">${task.description ?? ""}</textarea>

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
