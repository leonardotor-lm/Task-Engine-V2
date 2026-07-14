import { Config } from "./Config.js";
import { MainView } from "../ui/MainView.js";
import { TaskService } from "./TaskService.js";
import { Priority } from "../domain/Priority.js";

export class App {

    constructor() {

        this.taskService = new TaskService();

        this.mainView = new MainView({

            onCreateTask: (title) => {

                this.taskService.createTask({ title });

                this.render();

            },

            onToggleTask: (id) => {

                this.taskService.toggleTask(id);

                this.render();

            }

        });

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

    }

}
