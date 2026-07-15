import { Config } from "./Config.js";
import { TaskService } from "./TaskService.js";
import { AreaService } from "./AreaService.js";
import { MainView } from "../ui/MainView.js";
import { Priority } from "../domain/Priority.js";
import { View } from "./View.js";

export class App {

    constructor() {

        this.taskService = new TaskService();
        this.areaService = new AreaService();

        this.selectedTask = null;
        this.currentView = View.TASKS;

        this.mainView = new MainView({

            onCreateTask: (title) => {

                this.taskService.createTask({ title });

                this.render();

            },

            onCreateArea: (name, color) => {

                this.areaService.createArea({
                    name,
                    color
                });

                this.render();

            },

            onToggleTask: (id) => {

                this.taskService.toggleTask(id);

                this.render();

            },

            onSelectTask: (id) => {

                this.selectedTask = this.taskService.getTaskById(id);

                this.render();

            },

            onShowTasks: () => {

                this.currentView = View.TASKS;

                this.render();

            },

            onShowAreas: () => {

                this.currentView = View.AREAS;

                this.render();

            }

        });

    }

    start() {

        console.log(`${Config.APP_NAME} v${Config.VERSION}`);

        if (this.taskService.getAllTasks().length === 0) {

            this.taskService.createTask({
                title: "Preparar clase de Literatura",
                priority: Priority.HIGH
            });

            this.taskService.createTask({
                title: "Corregir evaluaciones"
            });

        }

        this.render();

    }

    render() {

        this.mainView.render({

            view: this.currentView,
            tasks: this.taskService.getAllTasks(),
            selectedTask: this.selectedTask,
            areas: this.areaService.getAllAreas()

        });

    }

}
