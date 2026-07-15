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

                <p><strong>${task.title}</strong></p>

                <p>${task.description || "Sin descripción"}</p>

                <button id="toggleTask">
                    ${task.isCompleted()
                        ? "Marcar pendiente"
                        : "Completar"}
                </button>

                <button id="editTask">
                    Editar
                </button>

            </aside>
        `;

    }

}
