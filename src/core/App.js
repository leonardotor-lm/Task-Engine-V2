import { Config } from "./Config.js";
import { MainView } from "../ui/MainView.js";
import { TaskService } from "./TaskService.js";
import { Priority } from "../domain/Priority.js";

export class App {

    constructor() {

        this.mainView = new MainView();
        this.taskService = new TaskService();

    }

    start() {

        console.log(`${Config.APP_NAME} v${Config.VERSION}`);

        this.taskService.createTask({
            title: "Preparar clase de Literatura",
            priority: Priority.HIGH
        });

        this.taskService.createTask({
            title: "Corregir evaluaciones"
        });

        this.render();

    }

    render() {

        const tasks = this.taskService.getAllTasks();

        this.mainView.render(tasks);

        this.bindEvents();

    }

    bindEvents() {

    const form = document.getElementById("taskForm");

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const input = document.getElementById("taskTitle");

        const title = input.value.trim();

        if (!title) {
            return;
        }

        this.taskService.createTask({
            title
        });

        input.value = "";

        this.render();

    });

    document.querySelectorAll(".task").forEach(item => {

        item.addEventListener("click", () => {

            this.taskService.toggleTask(item.dataset.id);

            this.render();

        });

    });

}
