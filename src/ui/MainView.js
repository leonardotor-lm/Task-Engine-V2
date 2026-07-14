export class MainView {

    render(tasks = []) {

        const app = document.getElementById("app");

        let html = `
            <h2>Mis tareas</h2>

            <form id="taskForm">
                <input
                    id="taskTitle"
                    type="text"
                    placeholder="Nueva tarea"
                    autocomplete="off">

                <button type="submit">Agregar</button>
            </form>

            <ul>
        `;

        for (const task of tasks) {

            const completed = task.status === "COMPLETED";

            html += `
                <li
                    class="task"
                    data-id="${task.id}"
                    style="cursor:pointer; ${completed ? "text-decoration:line-through;color:gray;" : ""}">
                    ${task.title}
                </li>
            `;
        }

        html += "</ul>";

        app.innerHTML = html;

    }

}
