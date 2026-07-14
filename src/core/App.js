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

        const task = this.taskService.createTask({

            title: "Preparar clase de Literatura",
            description: "Leer los cuentos.",
            priority: Priority.HIGH,
            dueDate: "2026-07-20"

        });

        console.log(task);

        console.log(this.taskService.getAllTasks());

        this.mainView.render();

    }

}
