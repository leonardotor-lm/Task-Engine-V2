export class MainView {

    render(tasks = []) {

        const app = document.getElementById("app");

        let html = "<h2>Mis tareas</h2><ul>";

        for (const task of tasks) {
            html += `<li>${task.title}</li>`;
        }

        html += "</ul>";

        app.innerHTML = html;

    }

}
