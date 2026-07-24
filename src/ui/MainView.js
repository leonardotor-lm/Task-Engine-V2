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
            searchQuery,
            taskFilters,
            taskSort,
            canRestoreBackup,
            syncConfigured,
            syncUrl,
            syncRevision
        } = state;

        document.getElementById("app").innerHTML = `
            <div class="layout">

                ${this.sidebar.render(
                    view,
                    searchQuery,
                    areas,
                    contexts,
                    tags,
                    taskFilters,
                    taskSort,
                    canRestoreBackup,
                    syncConfigured,
                    syncUrl,
                    syncRevision
                )}

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

    downloadBackup(json) {

        const blob = new Blob(
            [json],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const date = new Date()
            .toISOString()
            .slice(0, 10);

        link.href = url;
        link.download =
            `task-engine-backup-${date}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

    }

    backupSummary(data) {

        return [
            `${data.tasks} tareas`,
            `${data.areas} áreas`,
            `${data.contexts} contextos`,
            `${data.tags} etiquetas`
        ].join(", ");

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

        document.getElementById("syncConfigForm")?.addEventListener("submit", event => {

            event.preventDefault();

            try {

                this.callbacks.onSaveSyncConfig({
                    url: document
                        .getElementById("syncUrl")
                        .value,
                    token: document
                        .getElementById("syncToken")
                        .value
                });

                Dialog.alert(
                    "Conexión de sincronización guardada."
                );

            } catch (error) {

                Dialog.alert(error.message);

            }

        });

        document.getElementById("clearSyncConfig")?.addEventListener("click", () => {

            if (!Dialog.confirm(
                "¿Quitar la conexión? Los datos locales no se eliminarán."
            )) {
                return;
            }

            this.callbacks.onClearSyncConfig();

        });

        document.getElementById("pushToCloud")?.addEventListener("click", async () => {

            if (!Dialog.confirm(
                "¿Subir el estado local completo a Google Sheets?"
            )) {
                return;
            }

            try {

                const result =
                    await this.callbacks
                        .onPushToCloud();

                Dialog.alert(
                    `Subida completada en la revisión ${result.revision}: ${this.backupSummary(result.summary)}.`
                );

            } catch (error) {

                if (error.name === "SyncConflictError") {

                    Dialog.alert(
                        "La nube contiene cambios más recientes. No se sobrescribió nada. Descargá primero la versión de la nube."
                    );

                } else {

                    Dialog.alert(error.message);

                }

            }

        });

        document.getElementById("pullFromCloud")?.addEventListener("click", async () => {

            if (!Dialog.confirm(
                "La descarga reemplazará los datos locales y guardará una copia para poder deshacerla. ¿Continuar?"
            )) {
                return;
            }

            try {

                const result =
                    await this.callbacks
                        .onPullFromCloud();

                Dialog.alert(
                    `Descarga completada desde la revisión ${result.revision}: ${this.backupSummary(result.summary)}.`
                );

            } catch (error) {

                Dialog.alert(error.message);

            }

        });

        document.getElementById("exportBackup")?.addEventListener("click", () => {

            try {

                this.downloadBackup(
                    this.callbacks.onExportBackup()
                );

            } catch (error) {

                Dialog.alert(error.message);

            }

        });

        document.getElementById("importBackup")?.addEventListener("change", async event => {

            const file = event.target.files[0];

            if (!file) return;

            if (!Dialog.confirm(
                "La importación reemplazará los datos actuales. Se guardará una copia para poder deshacerla. ¿Continuar?"
            )) {

                event.target.value = "";
                return;

            }

            try {

                const data = this.callbacks.onImportBackup(
                    await file.text()
                );

                Dialog.alert(
                    `Importación completada: ${this.backupSummary(data)}.`
                );

            } catch (error) {

                Dialog.alert(error.message);

            }

        });

        document.getElementById("restoreLastImportBackup")?.addEventListener("click", () => {

            if (!Dialog.confirm(
                "¿Restaurar los datos anteriores a la última importación?"
            )) {
                return;
            }

            try {

                const data =
                    this.callbacks
                        .onRestoreLastImportBackup();

                Dialog.alert(
                    `Copia anterior restaurada: ${this.backupSummary(data)}.`
                );

            } catch (error) {

                Dialog.alert(error.message);

            }

        });

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

        document.getElementById("taskFilterForm")?.addEventListener("submit", event => {

            event.preventDefault();

            this.callbacks.onApplyTaskFilters({
                areaId: document
                    .getElementById("filterArea")
                    .value,
                contextId: document
                    .getElementById("filterContext")
                    .value,
                tagId: document
                    .getElementById("filterTag")
                    .value,
                priority: document
                    .getElementById("filterPriority")
                    .value,
                due: document
                    .getElementById("filterDue")
                    .value
            });

        });

        document.getElementById("clearTaskFilters")?.addEventListener("click", () => {

            this.callbacks.onClearTaskFilters();

        });

        document.getElementById("taskSort")?.addEventListener("change", event => {

            this.callbacks.onChangeTaskSort(
                event.target.value
            );

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

                document.getElementById("postponeTask")?.addEventListener("click", () => {

                    const newDate =
                        document.getElementById("postponeDate").value;

                    if (!newDate) {

                        Dialog.alert(
                            "Elegí una nueva fecha para posponer la tarea."
                        );

                        return;

                    }

                    try {

                        this.callbacks.onPostponeTask(
                            selectedTask.id,
                            newDate
                        );

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