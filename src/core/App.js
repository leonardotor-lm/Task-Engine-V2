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
        description: "Leer los cuentos.",
        priority: Priority.HIGH,
        dueDate: "2026-07-20"
    });

    this.taskService.createTask({
        title: "Corregir evaluaciones"
    });

    this.taskService.createTask({
        title: "Comprar leche"
    });

    const tasks = this.taskService.getAllTasks();

    this.mainView.render(tasks);

}
}
