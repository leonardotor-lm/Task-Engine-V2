import { Sidebar } from "./Sidebar.js";
import { TaskList } from "./TaskList.js";
import { TaskDetails } from "./TaskDetails.js";

export class MainView {

    constructor(callbacks) {

        this.callbacks = callbacks;

        this.sidebar = new Sidebar();
        this.taskList = new TaskList();
        this.taskDetails = new TaskDetails();

    }

    render(tasks = [], selectedTask = null) {

        document.getElementById("app").innerHTML = `
            <div class="layout">

                ${this.sidebar.render()}

                ${this.taskList.render(tasks)}

                ${this.taskDetails.render(selectedTask)}

            </div>
        `;

        this.bindEvents(selectedTask);

    }

    bindEvents(selectedTask) {

        document.getElementById("taskForm").addEventListener("submit", e => {

            e.preventDefault();

            const input = document.getElementById("taskTitle");

            const title = input.value.trim();

            if (!title) return;

            this.callbacks.onCreateTask(title);

        });

        document.querySelectorAll(".task").forEach(item => {

            item.addEventListener("click", () => {

                this.callbacks.onSelectTask(item.dataset.id);

            });

        });

        if (selectedTask) {

            document.getElementById("toggleTask").addEventListener("click", () => {

                this.callbacks.onToggleTask(selectedTask.id);

            });

            document.getElementById("editTask").addEventListener("click", () => {

                alert("Próximamente");

            });

        }

    }

}
