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
            view,
            selectedTask,
            areas,
            contexts,
            tags,
            searchQuery
        } = state;

        document.getElementById("app").innerHTML = `
            <div class="layout">

                ${this.sidebar.render(view, searchQuery)}

                ${this.viewRouter.render(state)}

                ${this.taskEditor.render(
                    selectedTask,
                    areas,
                    contexts,
                    tags
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
            contexts,
            tags
        } = state;

        document.getElementById("taskSearchForm")?.addEventListener("submit", event => {

            event.preventDefault();

            const query = document
                .getElementById("taskSearchInput")
                .value;

            this.callbacks.onSearchTasks(query);

        });

        document.getElementById("clearTaskSearch")?.addEventListener("click", () => {

            this.callbacks.onClearSearch();

        });

        document.getElementById("showInbox")?.addEventListener("click", () => {
            this.callbacks.onShowInbox();
        });

        document.getElementById("showToday")?.addEventListener("click", () => {
            this.callbacks.onShowToday();
        });

        document.getElementById("showUpcoming")?.addEventListener("click", () => {
            this.callbacks.onShowUpcoming();
        });

        document.getElementById("showAll")?.addEventListener("click", () => {
            this.callbacks.onShowAll();
        });

        document.getElementById("showCompleted")?.addEventListener("click", () => {
            this.callbacks.onShowCompleted();
        });

        document.getElementById("showArchived")?.addEventListener("click", () => {
            this.callbacks.onShowArchived();
        });

        document.getElementById("showTrash")?.addEventListener("click", () => {
            this.callbacks.onShowTrash();
        });

        document.getElementById("manageAreas")?.addEventListener("click", () => {
            this.callbacks.onShowAreas();
        });

        document.getElementById("manageContexts")?.addEventListener("click", () => {
            this.callbacks.onShowContexts();
        });

        document.getElementById("manageTags")?.addEventListener("click", () => {
            this.callbacks.onShowTags();
        });

        const taskViews = [

            View.INBOX,
            View.TODAY,
            View.UPCOMING,
            View.ALL,
            View.COMPLETED,
            View.ARCHIVED,
            View.TRASH

        ];

        if (taskViews.includes(view)) {

            document.getElementById("taskForm")?.addEventListener("submit", event => {

                event.preventDefault();

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

                document.getElementById("reopenTask")?.addEventListener("click", () => {
                    this.callbacks.onToggleTask(selectedTask.id);
                });

                document.getElementById("archiveTask")?.addEventListener("click", () => {

                    if (!Dialog.confirm("¿Archivar esta tarea?")) {
                        return;
                    }

                    this.callbacks.onArchiveTask(selectedTask.id);

                });

                document.getElementById("deleteTask")?.addEventListener("click", () => {

                    if (!Dialog.confirm("¿Mover esta tarea a la papelera?")) {
                        return;
                    }

                    this.callbacks.onDeleteTask(selectedTask.id);

                });

                document.getElementById("restoreArchivedTask")?.addEventListener("click", () => {

                    this.callbacks.onRestoreArchivedTask(selectedTask.id);

                });

                document.getElementById("restoreDeletedTask")?.addEventListener("click", () => {

                    this.callbacks.onRestoreDeletedTask(selectedTask.id);

                });

                document.getElementById("permanentlyDeleteTask")?.addEventListener("click", () => {

                    if (!Dialog.confirm(
                        "Esta acción no se puede deshacer. ¿Eliminar definitivamente esta tarea?"
                    )) {
                        return;
                    }

                    this.callbacks.onPermanentlyDeleteTask(selectedTask.id);

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

                    const tagIds = Array
                        .from(document.querySelectorAll(".taskTag:checked"))
                        .map(input => input.value);

                    if (!title) return;

                    this.callbacks.onUpdateTask(selectedTask.id, {

                        title,
                        description,
                        areaId,
                        contextId,
                        priority,
                        dueDate,
                        tagIds

                    });

                });

            }

        }

        if (
            view === View.AREAS ||
            view === View.CONTEXTS ||
            view === View.TAGS
        ) {

            const config = {

                [View.AREAS]: {
                    entities: areas,
                    name: "área",
                    create: this.callbacks.onCreateArea,
                    update: this.callbacks.onUpdateArea,
                    remove: this.callbacks.onDeleteArea
                },

                [View.CONTEXTS]: {
                    entities: contexts,
                    name: "contexto",
                    create: this.callbacks.onCreateContext,
                    update: this.callbacks.onUpdateContext,
                    remove: this.callbacks.onDeleteContext
                },

                [View.TAGS]: {
                    entities: tags,
                    name: "etiqueta",
                    create: this.callbacks.onCreateTag,
                    update: this.callbacks.onUpdateTag,
                    remove: this.callbacks.onDeleteTag
                }

            }[view];

            document.getElementById("entityForm")?.addEventListener("submit", event => {

                event.preventDefault();

                const name = document
                    .getElementById("entityName")
                    .value
                    .trim();

                const color =
                    document.getElementById("entityColor").value;

                if (!name) return;

                config.create(name, color);

            });

            document.querySelectorAll(".deleteEntity").forEach(button => {

                button.addEventListener("click", () => {

                    if (!Dialog.confirm(`¿Eliminar esta ${config.name}?`)) {
                        return;
                    }

                    try {

                        config.remove(button.dataset.id);

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(".editEntity").forEach(button => {

                button.addEventListener("click", () => {

                    const entity = config.entities.find(
                        entity => entity.id === button.dataset.id
                    );

                    if (!entity) return;

                    const name = Dialog.prompt(
                        `Nombre de la ${config.name}:`,
                        entity.name
                    );

                    if (name === null || name === "") return;

                    config.update(entity.id, name);

                });

            });

        }
    }

}