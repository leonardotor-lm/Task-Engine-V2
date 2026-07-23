import { Sidebar } from "./Sidebar.js";
import { TaskEditor } from "./TaskEditor.js";
import { ViewRouter } from "./ViewRouter.js";
import { View } from "../core/View.js";
import { Dialog } from "../components/Dialog.js";

export class MainView {

    constructor(callbacks) {

        this.callbacks = callbacks;

        this.sidebar = new Sidebar();
        this.taskEditor = new TaskEditor();
        this.viewRouter = new ViewRouter();

    }

    render(state) {

        const {
            selectedTask,
            areas,
            contexts
        } = state;

        document.getElementById("app").innerHTML = `
            <div class="layout">

                ${this.sidebar.render()}

                ${this.viewRouter.render(state)}

                ${this.taskEditor.render(
                    selectedTask,
                    areas,
                    contexts
                )}

            </div>
        `;

        this.bindEvents(state);

    }

    bindEvents(state) {

        const {
            view,
            selectedTask,
            areas,
            contexts
        } = state;

        document.getElementById("showTasks")?.addEventListener("click", () => {

            this.callbacks.onShowTasks();

        });

        document.getElementById("manageAreas")?.addEventListener("click", () => {

            this.callbacks.onShowAreas();

        });

        document.getElementById("manageContexts")?.addEventListener("click", () => {

            this.callbacks.onShowContexts();

        });

        if (view === View.TASKS) {

            document.getElementById("taskForm")?.addEventListener("submit", e => {

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

                document.getElementById("toggleTask")?.addEventListener("click", () => {

                    this.callbacks.onToggleTask(selectedTask.id);

                });

                document.getElementById("saveTask")?.addEventListener("click", () => {

                    const title = document
                        .getElementById("taskTitleEdit")
                        .value
                        .trim();

                    const description = document
                        .getElementById("taskDescriptionEdit")
                        .value
                        .trim();

                    const areaId =
                        document.getElementById("taskArea").value || null;

                    const contextId =
                        document.getElementById("taskContext").value || null;

                    const priority = Number(
                        document.getElementById("taskPriority").value
                    );

                    const dueDate =
                        document.getElementById("taskDueDate").value || null;

                    if (!title) return;

                    this.callbacks.onUpdateTask(selectedTask.id, {

                        title,
                        description,
                        areaId,
                        contextId,
                        priority,
                        dueDate

                    });

                });

            }

        }

        if (
            view === View.AREAS ||
            view === View.CONTEXTS
        ) {

            const isAreaView = view === View.AREAS;

            const entities = isAreaView
                ? areas
                : contexts;

            const entityName = isAreaView
                ? "área"
                : "contexto";

            document.getElementById("entityForm")?.addEventListener("submit", e => {

                e.preventDefault();

                const name = document
                    .getElementById("entityName")
                    .value
                    .trim();

                const color =
                    document.getElementById("entityColor").value;

                if (!name) return;

                if (isAreaView) {

                    this.callbacks.onCreateArea(name, color);

                } else {

                    this.callbacks.onCreateContext(name, color);

                }

            });

            document.querySelectorAll(".deleteEntity").forEach(button => {

                button.addEventListener("click", () => {

                    if (!Dialog.confirm(`¿Eliminar este ${entityName}?`)) {
                        return;
                    }

                    try {

                        if (isAreaView) {

                            this.callbacks.onDeleteArea(button.dataset.id);

                        } else {

                            this.callbacks.onDeleteContext(button.dataset.id);

                        }

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(".editEntity").forEach(button => {

                button.addEventListener("click", () => {

                    const entity = entities.find(
                        entity => entity.id === button.dataset.id
                    );

                    if (!entity) return;

                    const name = Dialog.prompt(
                        `Nombre del ${entityName}:`,
                        entity.name
                    );

                    if (name === null || name === "") return;

                    if (isAreaView) {

                        this.callbacks.onUpdateArea(entity.id, name);

                    } else {

                        this.callbacks.onUpdateContext(entity.id, name);

                    }

                });

            });

        }

    }

}