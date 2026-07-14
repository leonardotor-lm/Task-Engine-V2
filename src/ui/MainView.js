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

                <button type="submit">
                    Agregar
                </button>
            </form>

            <ul>
        `;

        for (const task of tasks) {
            html += `<li>${task.title}</li>`;
        }

        html += "</ul>";

        app.innerHTML = html;

    }

}
