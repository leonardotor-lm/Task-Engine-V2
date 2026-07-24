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
            allTasks,
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
                    tags,
                    allTasks
                )}

            </div>
        `;

        this.bindEvents(state);

    }

    bindEvents(state) {

        const {
            view,
            selectedTask,
            allTasks,
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

            document.querySelectorAll(".toggleSubtasks").forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    this.callbacks.onToggleTaskExpansion(
                        button.dataset.id
                    );

                });

            });

            if (selectedTask) {

                document.getElementById("subtaskForm")?.addEventListener("submit", event => {

                    event.preventDefault();

                    const title = document
                        .getElementById("subtaskTitle")
                        .value
                        .trim();

                    if (!title) return;

                    this.callbacks.onCreateSubtask(
                        selectedTask.id,
                        title
                    );

                });

                document.querySelectorAll(".subtaskLink").forEach(button => {

                    button.addEventListener("click", () => {
                        this.callbacks.onSelectTask(button.dataset.id);
                    });

                });

                document.getElementById("toggleTask")?.addEventListener("click", () => {

                    try {

                        this.callbacks.onToggleTask(selectedTask.id);

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

                document.getElementById("reopenTask")?.addEventListener("click", () => {

                    try {

                        this.callbacks.onToggleTask(selectedTask.id);

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

                document.getElementById("skipRecurringTask")?.addEventListener("click", () => {

                    if (!Dialog.confirm(
                        "¿Saltear esta vez y avanzar a la próxima fecha?"
                    )) {
                        return;
                    }

                    try {

                        this.callbacks.onSkipRecurringTask(
                            selectedTask.id
                        );

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

                document.getElementById("archiveTask")?.addEventListener("click", () => {

                    if (!Dialog.confirm("¿Archivar esta tarea?")) {
                        return;
                    }

                    try {

                        this.callbacks.onArchiveTask(selectedTask.id);

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

                document.getElementById("deleteTask")?.addEventListener("click", () => {

                    const hasSubtasks = allTasks.some(
                        task => task.parentTaskId === selectedTask.id
                    );

                    const message = hasSubtasks
                        ? "¿Mover esta tarea y todas sus subtareas a la papelera?"
                        : "¿Mover esta tarea a la papelera?";

                    if (!Dialog.confirm(message)) {
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

                    const hasSubtasks = allTasks.some(
                        task => task.parentTaskId === selectedTask.id
                    );

                    const message = hasSubtasks
                        ? "Esta acción no se puede deshacer. ¿Eliminar definitivamente esta tarea y todas sus subtareas?"
                        : "Esta acción no se puede deshacer. ¿Eliminar definitivamente esta tarea?";

                    if (!Dialog.confirm(message)) {
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

                    const recurrence =
                        document.getElementById("taskRecurrence").value || null;

                    if (!title) return;

                    try {

                        this.callbacks.onUpdateTask(selectedTask.id, {

                            title,
                            description,
                            areaId,
                            contextId,
                            priority,
                            dueDate,
                            tagIds,
                            recurrence

                        });

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

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
                    prompt: "Nombre del área:",
                    create: this.callbacks.onCreateArea,
                    update: this.callbacks.onUpdateArea,
                    remove: this.callbacks.onDeleteArea
                },

                [View.CONTEXTS]: {
                    entities: contexts,
                    name: "contexto",
                    prompt: "Nombre del contexto:",
                    create: this.callbacks.onCreateContext,
                    update: this.callbacks.onUpdateContext,
                    remove: this.callbacks.onDeleteContext
                },

                [View.TAGS]: {
                    entities: tags,
                    name: "etiqueta",
                    prompt: "Nombre de la etiqueta:",
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

                    const article = config.name === "contexto"
                        ? "este"
                        : "esta";

                    if (!Dialog.confirm(`¿Eliminar ${article} ${config.name}?`)) {
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
                        config.prompt,
                        entity.name
                    );

                    if (name === null || name === "") return;

                    config.update(entity.id, name);

                });

            });

        }
    }

}