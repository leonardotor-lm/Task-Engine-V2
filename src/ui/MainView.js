export class MainView {

    render(tasks = []) {

        const app = document.getElementById("app");

        app.innerHTML = `
            <h2>Mis tareas</h2>

            <ul>
                ${tasks.map(task => `
                    <li>${task.title}</li>
                `).join("")}
            </ul>
        `;

    }

}
