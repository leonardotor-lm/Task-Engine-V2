import { Config } from "./Config.js";
import { MainView } from "../ui/MainView.js";
import { TaskRepository } from "../infrastructure/TaskRepository.js";
import { Priority } from "../domain/Priority.js";

export class App {

    constructor() {

        this.mainView = new MainView();

        this.taskRepository = new TaskRepository();

    }

    start() {

        console.log(`${Config.APP_NAME} v${Config.VERSION}`);

        const task = this.taskRepository.add({

            title: "Preparar clase de Literatura",

            description: "Leer los cuentos.",

            priority: Priority.HIGH,

            dueDate: "2026-07-20"

        });

        console.log(task);

        console.log(this.taskRepository.getAll());

        this.mainView.render();

    }

}
