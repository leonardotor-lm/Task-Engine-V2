import { Sidebar } from "./Sidebar.js";
import { TaskEditor } from "./TaskEditor.js";
import { GoalEditor } from "./GoalEditor.js";
import { ViewRouter } from "./ViewRouter.js";
import { View } from "../core/View.js";
import { Dialog } from "../components/Dialog.js";
import { TaskSwipeController } from "./TaskSwipeController.js";
import { hasTaskEditorChanges } from "./TaskEditorDraft.js";
import { SearchableSelect } from "./SearchableSelect.js";
import {
    SearchableMultiSelect
} from "./SearchableMultiSelect.js";

export class MainView {

    constructor(callbacks) {

        this.callbacks = callbacks;

        this.sidebar = new Sidebar();
        this.taskEditor = new TaskEditor();
        this.goalEditor = new GoalEditor();
        this.viewRouter = new ViewRouter();
        this.taskSwipeController =
            new TaskSwipeController();
        this.searchableSelect =
            new SearchableSelect();
        this.searchableMultiSelect =
            new SearchableMultiSelect();

        this.mobileHistoryInitialized =
            false;

    }

    render(state) {

        const {
            view,
            selectedTask,
            selectedGoal,
            goalEditorOpen,
            allTasks,
            areas,
            activeAreaId,
            contexts,
            tags,
            searchQuery,
            advancedSearchMode,
            advancedSearchError,
            customFilters,
            currentCustomFilterId,
            taskFilters,
            taskSort,
            canRestoreBackup,
            syncConfigured,
            syncUrl,
            syncRevision,
            syncPendingChanges,
            syncLastSuccess,
            syncRemoteRevision,
            syncRemoteUpdateAvailable,
            syncInProgress,
            syncLastError,
            bulkSelectionMode,
            showCompletedTasks
        } = state;

        document.getElementById("app").innerHTML = `
            <div class="layout">

                <header class="mobileHeader">

                    <button
                        id="toggleMobileMenu"
                        type="button"
                        class="mobileMenuButton"
                        aria-controls="appSidebar"
                        aria-expanded="false"
                        aria-label="Abrir navegación">
                        ☰
                    </button>

                    <strong>Task Engine</strong>

                </header>

                <button
                    id="mobileMenuBackdrop"
                    type="button"
                    class="mobileMenuBackdrop"
                    aria-label="Cerrar navegación"
                    tabindex="-1">
                </button>

                ${this.sidebar.render(
                    view,
                    searchQuery,
                    areas,
                    activeAreaId,
                    contexts,
                    tags,
                    taskFilters,
                    taskSort,
                    canRestoreBackup,
                    syncConfigured,
                    syncUrl,
                    syncRevision,
                    syncPendingChanges,
                    syncLastSuccess,
                    syncRemoteRevision,
                    syncRemoteUpdateAvailable,
                    bulkSelectionMode,
                    syncInProgress,
                    syncLastError,
                    showCompletedTasks,
                    advancedSearchMode,
                    advancedSearchError,
                    customFilters,
                    currentCustomFilterId
                )}

                ${this.viewRouter.render(state)}

                ${this.taskEditor.render(
                    selectedTask,
                    areas,
                    contexts,
                    tags,
                    allTasks,
                    state.goals
                )}

                ${this.goalEditor.render(
                    goalEditorOpen
                        ? selectedGoal
                        : null,
                    state.goals,
                    allTasks
                )}

            </div>
        `;

        this.searchableSelect.bindAll();
        this.searchableMultiSelect.bind(
            "bulkTagPicker"
        );
        this.searchableMultiSelect.bind(
            "bulkGoalPicker"
        );
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

    hasActiveEntityEdit() {

        return Boolean(
            document.querySelector(
                ".entityEditForm:not([hidden])"
            )
        );

    }

    hasActiveEntityCreation() {

        const form = document.querySelector(
            "#entityForm"
        );

        if (!form) return false;

        const name = form.querySelector(
            "#entityName"
        )?.value.trim();

        const color = form.querySelector(
            "#entityColor"
        )?.value.toLowerCase();

        const hasFocus =
            typeof form.contains === "function" &&
            form.contains(document.activeElement);

        return Boolean(
            hasFocus ||
            name ||
            (
                color &&
                color !== "#3b82f6"
            )
        );

    }

    hasUnsavedTaskEdit(task) {

        return Boolean(
            task &&
            hasTaskEditorChanges(task)
        );

    }

    confirmDiscardTaskChanges(task) {

        if (
            !this.hasUnsavedTaskEdit(task)
        ) {
            return true;
        }

        return Dialog.confirm(
            "Hay cambios sin guardar. ¿Descartarlos?"
        );

    }

    backupSummary(data) {

        return [
            `${data.tasks} tareas`,
            `${data.areas} áreas`,
            `${data.contexts} contextos`,
            `${data.tags} etiquetas`
        ].join(", ");

    }

    navigateAndResetScroll(callback) {

        callback();

        const content =
            document.querySelector(
                ".content"
            );

        if (content) {
            content.scrollTop = 0;
        }

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto"
        });

    }

    setupMobileBackNavigation(state) {

        if (
            !window.matchMedia(
                "(max-width: 760px)"
            ).matches
        ) {
            return;
        }

        const guardKey =
            "taskEngineMobileGuard";

        if (
            !this.mobileHistoryInitialized
        ) {

            window.history.replaceState(
                {
                    ...window.history.state,
                    taskEngineRoot: true
                },
                ""
            );

            window.history.pushState(
                { [guardKey]: true },
                ""
            );

            this.mobileHistoryInitialized =
                true;

        }

        window.onpopstate = () => {

            const restoreGuard = () => {

                window.history.pushState(
                    { [guardKey]: true },
                    ""
                );

            };

            const openActions =
                document.querySelector(
                    ".quickMoreActions[open]"
                );

            if (openActions) {

                openActions.open = false;
                restoreGuard();
                return;

            }

            const layout =
                document.querySelector(
                    ".layout.mobileMenuOpen"
                );

            if (layout) {

                layout.classList.remove(
                    "mobileMenuOpen"
                );

                document.getElementById(
                    "toggleMobileMenu"
                )?.setAttribute(
                    "aria-expanded",
                    "false"
                );

                restoreGuard();
                return;

            }

            if (state.selectedTask) {

                if (
                    !this.confirmDiscardTaskChanges(
                        state.selectedTask
                    )
                ) {

                    restoreGuard();
                    return;

                }

                restoreGuard();

                this.callbacks
                    .onCloseTaskEditor();

                return;

            }

            if (state.goalEditorOpen) {

                restoreGuard();

                this.callbacks
                    .onCloseGoalEditor();

                return;

            }

            if (state.view === View.PROJECT) {

                restoreGuard();

                this.callbacks
                    .onCloseProject();

                return;

            }

            if (state.view === View.GOAL) {

                restoreGuard();

                this.callbacks
                    .onCloseGoalView();

                return;

            }

            if (
                !Dialog.confirm(
                    "¿Salir de Task Engine?"
                )
            ) {

                restoreGuard();
                return;

            }

            window.onpopstate = null;
            window.history.back();

        };

    }

    bindEvents(state) {

        const {
            view,
            selectedTask,
            selectedGoal,
            allTasks,
            areas,
            contexts,
            tags,
            syncPendingChanges,
            syncRemoteUpdateAvailable
        } = state;

        this.taskSwipeController.bind({
            onComplete: id => {

                try {

                    this.callbacks
                        .onToggleTask(id);

                    return true;

                } catch (error) {

                    Dialog.alert(error.message);
                    return false;

                }

            },
            onUndoComplete: id => {

                try {

                    this.callbacks
                        .onToggleTask(id);

                } catch (error) {

                    Dialog.alert(error.message);

                }

            }
        });

        if (selectedTask) {
            this.taskEditor
                .bindClassificationSelectors();
        }

        const layout =
            document.querySelector(".layout");

        const mobileMenuButton =
            document.getElementById(
                "toggleMobileMenu"
            );

        const closeMobileMenu = () => {

            layout?.classList.remove(
                "mobileMenuOpen"
            );

            mobileMenuButton?.setAttribute(
                "aria-expanded",
                "false"
            );

        };

        mobileMenuButton?.addEventListener(
            "click",
            () => {

                const isOpen =
                    layout?.classList.toggle(
                        "mobileMenuOpen"
                    );

                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    String(Boolean(isOpen))
                );

            }
        );

        document.getElementById(
            "mobileMenuBackdrop"
        )?.addEventListener(
            "click",
            closeMobileMenu
        );

        this.setupMobileBackNavigation(
            state
        );

        if (
            window.matchMedia(
                "(max-width: 760px)"
            ).matches
        ) {

            document.querySelectorAll(
                '.editorSection[data-mobile-collapsed="true"]'
            ).forEach(section => {

                section.removeAttribute(
                    "open"
                );

            });

        }

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

            const conflict =
                syncPendingChanges &&
                syncRemoteUpdateAvailable;

            if (!Dialog.confirm(
                conflict
                    ? "Hay cambios locales y remotos. Conservar la versión de la nube reemplazará los datos locales, pero guardará una copia para poder deshacerlo. ¿Continuar?"
                    : "La descarga reemplazará los datos locales y guardará una copia para poder deshacerla. ¿Continuar?"
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

        document.getElementById("overwriteCloud")?.addEventListener("click", async () => {

            if (!Dialog.confirm(
                "Hay cambios locales y remotos. Conservar la versión local reemplazará en la nube los cambios hechos en otro dispositivo. Esta decisión no se puede deshacer desde la nube. ¿Continuar?"
            )) {
                return;
            }

            try {

                const result =
                    await this.callbacks
                        .onOverwriteCloud();

                Dialog.alert(
                    `Se conservó la versión local en la revisión ${result.revision}: ${this.backupSummary(result.summary)}.`
                );

            } catch (error) {

                if (error.name === "SyncConflictError") {

                    Dialog.alert(
                        "La nube volvió a cambiar durante la operación. No se sobrescribió nada. Recargá la aplicación e intentá nuevamente."
                    );

                } else {

                    Dialog.alert(error.message);

                }

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

        document.getElementById(
            "toggleAdvancedSearch"
        )?.addEventListener("click", () => {

            this.callbacks.onToggleAdvancedSearch();

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

        document.getElementById(
            "saveCustomFilter"
        )?.addEventListener("click", () => {

            const name = Dialog.prompt(
                "Nombre del filtro personalizado:",
                ""
            );

            if (name === null || !name.trim()) {
                return;
            }

            try {

                this.callbacks.onSaveCustomFilter(
                    name.trim()
                );

            } catch (error) {

                Dialog.alert(error.message);

            }

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

        document.getElementById(
            "openTaskCreation"
        )?.addEventListener("click", () => {

            this.callbacks.onOpenTaskCreation();

        });

        document.getElementById(
            "toggleTaskMetadata"
        )?.addEventListener("click", () => {

            this.callbacks.onToggleTaskMetadata();

        });

        document.getElementById(
            "toggleCompletedTasks"
        )?.addEventListener("click", () => {

            this.callbacks.onToggleCompletedTasks();

        });

        document.getElementById(
            "toggleBulkMode"
        )?.addEventListener("click", () => {

            this.callbacks.onToggleBulkMode();

        });

        const navigationActions = [
            ["showInbox", "onShowInbox"],
            ["showToday", "onShowToday"],
            ["showUpcoming", "onShowUpcoming"],
            ["showAll", "onShowAll"],
            ["showCompleted", "onShowCompleted"],
            ["showArchived", "onShowArchived"],
            ["showTrash", "onShowTrash"],
            ["showGoals", "onShowGoals"],
            ["manageAreas", "onShowAreas"],
            ["manageContexts", "onShowContexts"],
            ["manageTags", "onShowTags"]
        ];

        for (
            const [
                elementId,
                callbackName
            ] of navigationActions
        ) {

            document.getElementById(
                elementId
            )?.addEventListener("click", () => {

                if (
                    selectedTask &&
                    !this.confirmDiscardTaskChanges(
                        selectedTask
                    )
                ) {
                    return;
                }

                this.navigateAndResetScroll(
                    () =>
                        this.callbacks[
                            callbackName
                        ]()
                );

            });

        }

        if (view === View.GOALS) {

            document.getElementById(
                "openGoalCreation"
            )?.addEventListener(
                "click",
                () =>
                    this.callbacks
                        .onOpenGoalCreation()
            );

            document.getElementById(
                "cancelGoalCreation"
            )?.addEventListener(
                "click",
                () =>
                    this.callbacks
                        .onCancelGoalCreation()
            );

            document.querySelectorAll(
                ".showGoalStatus"
            ).forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        this.callbacks
                            .onShowGoalStatus(
                                button.dataset.status
                            )
                );

            });

            const goalActions = [
                ["reopenGoal", "onReopenGoal"],
                [
                    "restoreArchivedGoal",
                    "onRestoreArchivedGoal"
                ],
                ["deleteGoal", "onDeleteGoal"],
                [
                    "restoreDeletedGoal",
                    "onRestoreDeletedGoal"
                ],
                [
                    "permanentlyDeleteGoal",
                    "onPermanentlyDeleteGoal"
                ]
            ];

            for (
                const [
                    className,
                    callbackName
                ] of goalActions
            ) {

                document.querySelectorAll(
                    `.${className}`
                ).forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            if (
                                className ===
                                    "permanentlyDeleteGoal" &&
                                !Dialog.confirm(
                                    "¿Eliminar definitivamente este objetivo y sus subobjetivos?"
                                )
                            ) {
                                return;
                            }

                            this.callbacks[
                                callbackName
                            ](button.dataset.id);

                        }
                    );

                });

            }

            document.querySelectorAll(
                ".openGoal"
            ).forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        this.callbacks
                            .onSelectGoal(
                                button.dataset.id
                            );
                    }
                );

            });

            document.getElementById(
                "goalForm"
            )?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const title = document
                        .getElementById(
                            "goalTitle"
                        )
                        .value
                        .trim();

                    if (!title) return;

                    const description = document
                        .getElementById(
                            "goalDescription"
                        )
                        .value
                        .trim();

                    const dueDate = document
                        .getElementById(
                            "goalDueDate"
                        )
                        .value || null;

                    this.callbacks.onCreateGoal({
                        title,
                        description,
                        dueDate
                    });

                }
            );

        }

        if (selectedGoal) {

            this.goalEditor
                .bindAssociationSelectors();

            document.getElementById(
                "closeGoalView"
            )?.addEventListener(
                "click",
                () =>
                    this.callbacks
                        .onCloseGoalView()
            );

            document.getElementById(
                "editGoal"
            )?.addEventListener(
                "click",
                () =>
                    this.callbacks
                        .onOpenGoalEditor()
            );

            document.getElementById(
                "closeGoalEditor"
            )?.addEventListener(
                "click",
                () =>
                    this.callbacks
                        .onCloseGoalEditor()
            );

            document.getElementById(
                "goalEditorForm"
            )?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const title = document
                        .getElementById(
                            "goalTitleEdit"
                        )
                        .value
                        .trim();

                    if (!title) return;

                    this.callbacks.onUpdateGoal(
                        selectedGoal.id,
                        {
                            title,
                            description: document
                                .getElementById(
                                    "goalDescriptionEdit"
                                )
                                .value
                                .trim(),
                            dueDate: document
                                .getElementById(
                                    "goalDueDateEdit"
                                )
                                .value || null
                        }
                    );

                }
            );

            document.getElementById(
                "completeGoal"
            )?.addEventListener(
                "click",
                () => {

                    if (Dialog.confirm(
                        "¿Marcar este objetivo como completado?"
                    )) {
                        this.callbacks
                            .onCompleteGoal(
                                selectedGoal.id
                            );
                    }

                }
            );

            document.getElementById(
                "archiveGoal"
            )?.addEventListener(
                "click",
                () => {

                    if (Dialog.confirm(
                        "¿Archivar este objetivo?"
                    )) {
                        this.callbacks
                            .onArchiveGoal(
                                selectedGoal.id
                            );
                    }

                }
            );

            document.getElementById(
                "deleteGoalFromEditor"
            )?.addEventListener(
                "click",
                () => {

                    if (Dialog.confirm(
                        "¿Mover este objetivo y sus subobjetivos a la papelera?"
                    )) {
                        this.callbacks.onDeleteGoal(
                            selectedGoal.id
                        );
                    }

                }
            );

            document.getElementById(
                "subgoalForm"
            )?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const title = document
                        .getElementById(
                            "subgoalTitle"
                        )
                        .value
                        .trim();

                    if (!title) return;

                    this.callbacks.onCreateSubgoal(
                        selectedGoal.id,
                        title
                    );

                }
            );

            document.getElementById(
                "goalParentForm"
            )?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const parentGoalId = document
                        .getElementById(
                            "goalParentId"
                        )
                        .value;

                    if (!parentGoalId) return;

                    try {
                        this.callbacks.onMoveGoal(
                            selectedGoal.id,
                            parentGoalId
                        );
                    } catch (error) {
                        Dialog.alert(error.message);
                    }

                }
            );

            document.getElementById(
                "goalTaskForm"
            )?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const taskId = document
                        .getElementById(
                            "goalTaskId"
                        )
                        .value;

                    if (!taskId) return;

                    try {
                        this.callbacks
                            .onAssociateTaskToGoal(
                                taskId,
                                selectedGoal.id
                            );
                    } catch (error) {
                        Dialog.alert(error.message);
                    }

                }
            );

            document.getElementById(
                "goalTaskDetachForm"
            )?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const taskId = document
                        .getElementById(
                            "goalTaskDetachId"
                        )
                        .value;

                    if (!taskId) return;

                    try {
                        this.callbacks
                            .onDetachTaskFromGoal(
                                taskId,
                                selectedGoal.id
                            );
                    } catch (error) {
                        Dialog.alert(error.message);
                    }

                }
            );

            document.getElementById(
                "detachGoal"
            )?.addEventListener(
                "click",
                () => {

                    try {
                        this.callbacks.onDetachGoal(
                            selectedGoal.id
                        );
                    } catch (error) {
                        Dialog.alert(error.message);
                    }

                }
            );

        }

        document.querySelectorAll(
            ".showAreaView"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        selectedTask &&
                        !this.confirmDiscardTaskChanges(
                            selectedTask
                        )
                    ) {
                        return;
                    }

                    this.navigateAndResetScroll(
                        () =>
                            this.callbacks
                                .onShowArea(
                                    button.dataset.id
                                )
                    );

                }
            );

        });

        document.querySelectorAll(
            ".showCustomFilter"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        selectedTask &&
                        !this.confirmDiscardTaskChanges(
                            selectedTask
                        )
                    ) {
                        return;
                    }

                    this.navigateAndResetScroll(
                        () =>
                            this.callbacks
                                .onApplyCustomFilter(
                                    button.dataset.id
                                )
                    );

                }
            );

        });

        document.querySelectorAll(
            ".renameCustomFilter"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const item = button.closest(
                        ".customFilterItem"
                    );

                    item.querySelector(
                        ".customFilterDisplay"
                    ).hidden = true;

                    const form = item.querySelector(
                        ".customFilterRenameForm"
                    );

                    form.hidden = false;
                    form.querySelector(
                        ".customFilterRenameInput"
                    ).focus();

                }
            );

        });

        document.querySelectorAll(
            ".cancelCustomFilterRename"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const item = button.closest(
                        ".customFilterItem"
                    );

                    item.querySelector(
                        ".customFilterRenameForm"
                    ).hidden = true;

                    item.querySelector(
                        ".customFilterDisplay"
                    ).hidden = false;

                }
            );

        });

        document.querySelectorAll(
            ".customFilterRenameForm"
        ).forEach(form => {

            form.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const name = form
                        .querySelector(
                            ".customFilterRenameInput"
                        )
                        .value.trim();

                    if (!name) return;

                    try {

                        this.callbacks
                            .onRenameCustomFilter(
                                form.dataset.id,
                                name
                            );

                    } catch (error) {

                        Dialog.alert(
                            error.message
                        );

                    }

                }
            );

        });

        document.querySelectorAll(
            ".deleteCustomFilter"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (!Dialog.confirm(
                        "¿Eliminar este filtro personalizado?"
                    )) {
                        return;
                    }

                    this.callbacks
                        .onDeleteCustomFilter(
                            button.dataset.id
                        );

                }
            );

        });

        const taskViews = [

            View.INBOX,
            View.TODAY,
            View.UPCOMING,
            View.ALL,
            View.AREA,
            View.COMPLETED,
            View.ARCHIVED,
            View.TRASH,
            View.PROJECT,
            View.GOAL

        ];

        if (taskViews.includes(view)) {

            document.getElementById(
                "cancelTaskCreation"
            )?.addEventListener("click", () => {

                this.callbacks.onCancelTaskCreation();

            });

            document.getElementById("taskForm")?.addEventListener("submit", event => {

                event.preventDefault();

                const input = document.getElementById("taskTitle");
                const title = input.value.trim();

                if (!title) return;

                if (view === View.PROJECT) {

                    this.callbacks
                        .onCreateProjectSubtask(title);

                    return;

                }

                this.callbacks.onCreateTask(title);

            });

            document.querySelectorAll(
                ".taskCompleteCheckbox"
            ).forEach(checkbox => {

                checkbox.addEventListener(
                    "click",
                    event =>
                        event.stopPropagation()
                );

                checkbox.addEventListener(
                    "change",
                    () => {

                        try {

                            this.callbacks.onToggleTask(
                                checkbox.dataset.id
                            );

                        } catch (error) {

                            checkbox.checked = false;
                            Dialog.alert(error.message);

                        }

                    }
                );

            });

            document.querySelectorAll(
                ".bulkTaskCheckbox"
            ).forEach(checkbox => {

                checkbox.addEventListener(
                    "click",
                    event =>
                        event.stopPropagation()
                );

                checkbox.addEventListener(
                    "change",
                    () => {

                        this.callbacks
                            .onToggleBulkSelection(
                                checkbox.dataset.id,
                                checkbox.checked
                            );

                    }
                );

            });

            document.getElementById(
                "clearBulkSelection"
            )?.addEventListener("click", () => {

                this.callbacks
                    .onClearBulkSelection();

            });

            document.getElementById(
                "bulkRestoreTasks"
            )?.addEventListener("click", () => {

                const action =
                    view === View.COMPLETED
                        ? "reactivar"
                        : "restaurar";

                if (!Dialog.confirm(
                    `¿${action === "reactivar" ? "Reactivar" : "Restaurar"} las tareas seleccionadas y sus subtareas?`
                )) {
                    return;
                }

                try {

                    const count =
                        this.callbacks
                            .onBulkRestoreTasks();

                    Dialog.alert(
                        `Se ${action === "reactivar" ? "reactivaron" : "restauraron"} ${count} ${count === 1 ? "tarea" : "tareas"}.`
                    );

                } catch (error) {

                    Dialog.alert(error.message);

                }

            });

            document.getElementById(
                "applyBulkChanges"
            )?.addEventListener("click", () => {

                const priorityValue =
                    document.getElementById(
                        "bulkPriority"
                    ).value;

                const dueDate = document
                    .getElementById(
                        "bulkDueDate"
                    ).value;

                const areaValue = document
                    .getElementById(
                        "bulkArea"
                    ).value;

                const contextValue = document
                    .getElementById(
                        "bulkContext"
                    ).value;

                const addTagIds = [
                    ...document
                        .querySelectorAll(
                            ".bulkTagCheckbox"
                        )
                ].map(checkbox => checkbox.value);

                const addGoalIds = [
                    ...document
                        .querySelectorAll(
                            ".bulkGoalInput"
                        )
                ].map(input => input.value);

                const changes = {};

                if (priorityValue !== "") {
                    changes.priority =
                        Number(priorityValue);
                }

                if (dueDate) {
                    changes.dueDate = dueDate;
                }

                if (areaValue !== "") {
                    changes.areaId =
                        areaValue === "__CLEAR__"
                            ? null
                            : areaValue;
                }

                if (contextValue !== "") {
                    changes.contextId =
                        contextValue === "__CLEAR__"
                            ? null
                            : contextValue;
                }

                if (addTagIds.length > 0) {
                    changes.addTagIds =
                        addTagIds;
                }

                if (addGoalIds.length > 0) {
                    changes.addGoalIds =
                        addGoalIds;
                }

                if (
                    Object.keys(changes)
                        .length === 0
                ) {

                    Dialog.alert(
                        "Elegí al menos un cambio para aplicar."
                    );

                    return;

                }

                try {

                    const count =
                        this.callbacks
                            .onBulkUpdateTasks({
                                ...changes
                            });

                    Dialog.alert(
                        `Cambios aplicados en ${count} ${count === 1 ? "tarea" : "tareas"}.`
                    );

                } catch (error) {

                    Dialog.alert(error.message);

                }

            });

            document.getElementById(
                "bulkCompleteTasks"
            )?.addEventListener("click", () => {

                if (!Dialog.confirm(
                    "¿Completar todas las tareas seleccionadas?"
                )) {
                    return;
                }

                try {

                    const count =
                        this.callbacks
                            .onBulkCompleteTasks();

                    Dialog.alert(
                        `Se completaron ${count} ${count === 1 ? "tarea" : "tareas"}.`
                    );

                } catch (error) {

                    Dialog.alert(error.message);

                }

            });

            document.getElementById(
                "bulkArchiveTasks"
            )?.addEventListener("click", () => {

                if (!Dialog.confirm(
                    "¿Archivar todas las tareas seleccionadas?"
                )) {
                    return;
                }

                try {

                    const count =
                        this.callbacks
                            .onBulkArchiveTasks();

                    Dialog.alert(
                        `Se archivaron ${count} ${count === 1 ? "tarea" : "tareas"}.`
                    );

                } catch (error) {

                    Dialog.alert(error.message);

                }

            });

            document.getElementById(
                "bulkDeleteTasks"
            )?.addEventListener("click", () => {

                if (!Dialog.confirm(
                    "¿Enviar a la papelera las tareas seleccionadas? Las subtareas descendientes también serán enviadas."
                )) {
                    return;
                }

                try {

                    const count =
                        this.callbacks
                            .onBulkDeleteTasks();

                    Dialog.alert(
                        `Se enviaron ${count} ${count === 1 ? "tarea" : "tareas"} a la papelera.`
                    );

                } catch (error) {

                    Dialog.alert(error.message);

                }

            });

            document.getElementById(
                "bulkPermanentlyDeleteTasks"
            )?.addEventListener("click", () => {

                if (!Dialog.confirm(
                    "¿Eliminar definitivamente las tareas seleccionadas y sus subtareas? Esta acción no se puede deshacer."
                )) {
                    return;
                }

                try {

                    const count =
                        this.callbacks
                            .onBulkPermanentlyDeleteTasks();

                    Dialog.alert(
                        `Se eliminaron definitivamente ${count} ${count === 1 ? "tarea" : "tareas"}.`
                    );

                } catch (error) {

                    Dialog.alert(error.message);

                }

            });

            document.getElementById(
                "emptyTrash"
            )?.addEventListener("click", () => {

                const count = allTasks.filter(
                    task => task.isDeleted()
                ).length;

                if (!Dialog.confirm(
                    `¿Eliminar definitivamente las ${count} ${count === 1 ? "tarea" : "tareas"} de la papelera? Esta acción no se puede deshacer.`
                )) {
                    return;
                }

                try {

                    const deletedCount =
                        this.callbacks.onEmptyTrash();

                    Dialog.alert(
                        `Se vació la papelera: ${deletedCount} ${deletedCount === 1 ? "tarea eliminada" : "tareas eliminadas"} definitivamente.`
                    );

                } catch (error) {

                    Dialog.alert(error.message);

                }

            });

            document.getElementById(
                "openProjectTaskCreation"
            )?.addEventListener("click", () => {

                this.callbacks
                    .onOpenProjectTaskCreation();

            });

            document.getElementById(
                "closeProjectView"
            )?.addEventListener("click", () => {

                this.callbacks.onCloseProject();

            });

            document.getElementById(
                "editProjectTask"
            )?.addEventListener("click", event => {

                this.callbacks.onEditProjectTask(
                    event.currentTarget.dataset.id
                );

            });

            document.querySelectorAll(
                ".quickMoreActions"
            ).forEach(menu => {

                menu.addEventListener(
                    "click",
                    event => event.stopPropagation()
                );

            });

            document.querySelectorAll(
                ".closeQuickActions"
            ).forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        button.closest(
                            ".quickMoreActions"
                        ).open = false;

                    }
                );

            });

            document.querySelectorAll(
                ".quickEditTask"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    this.callbacks.onSelectTask(
                        button.closest(
                            ".quickMoreActions"
                        ).dataset.id
                    );

                });

            });

            document.querySelectorAll(
                ".quickDuplicateTask"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    const id = button.closest(
                        ".quickMoreActions"
                    ).dataset.id;

                    const hasSubtasks =
                        allTasks.some(
                            task =>
                                task.parentTaskId === id
                        );

                    const message = hasSubtasks
                        ? "¿Duplicar esta tarea y todo su árbol como un proyecto nuevo?"
                        : "¿Duplicar esta tarea?";

                    if (!Dialog.confirm(message)) {
                        return;
                    }

                    try {

                        const duplicatedId =
                            this.callbacks
                                .onDuplicateTask(id);

                        if (!duplicatedId) return;

                        let duplicatedTask =
                            [...document.querySelectorAll(
                                ".task"
                            )].find(
                                task =>
                                    task.dataset.id ===
                                    duplicatedId
                            );

                        if (!duplicatedTask) {

                            this.callbacks
                                .onRevealTask(
                                    duplicatedId
                                );

                            duplicatedTask =
                                [...document.querySelectorAll(
                                    ".task"
                                )].find(
                                    task =>
                                        task.dataset.id ===
                                        duplicatedId
                                );

                        }

                        if (duplicatedTask) {

                            duplicatedTask.classList.add(
                                "recentlyDuplicatedTask"
                            );

                            duplicatedTask.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                            });

                        }

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(
                ".quickSkipRecurringTask"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    if (!Dialog.confirm(
                        "¿Saltear esta instancia y avanzar a la próxima fecha?"
                    )) {
                        return;
                    }

                    try {

                        this.callbacks
                            .onQuickSkipRecurringTask(
                                button.closest(
                                    ".quickMoreActions"
                                ).dataset.id
                            );

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(
                ".quickEndRecurrence"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    if (!Dialog.confirm(
                        "¿Finalizar la recurrencia? La tarea conservará su fecha actual, pero dejará de repetirse."
                    )) {
                        return;
                    }

                    try {

                        this.callbacks
                            .onQuickEndRecurrence(
                                button.closest(
                                    ".quickMoreActions"
                                ).dataset.id
                            );

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(
                ".quickArchiveTask"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    if (!Dialog.confirm(
                        "¿Archivar esta tarea?"
                    )) {
                        return;
                    }

                    try {

                        this.callbacks.onArchiveTask(
                            button.closest(
                                ".quickMoreActions"
                            ).dataset.id
                        );

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(
                ".quickDeleteTask"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    const id = button.closest(
                        ".quickMoreActions"
                    ).dataset.id;

                    const hasSubtasks =
                        allTasks.some(
                            task =>
                                task.parentTaskId === id
                        );

                    const message = hasSubtasks
                        ? "¿Mover esta tarea y todas sus subtareas a la papelera?"
                        : "¿Mover esta tarea a la papelera?";

                    if (!Dialog.confirm(message)) {
                        return;
                    }

                    this.callbacks.onDeleteTask(id);

                });

            });

            document.querySelectorAll(
                ".quickPostpone"
            ).forEach(menu => {

                menu.addEventListener(
                    "click",
                    event => event.stopPropagation()
                );

            });

            document.querySelectorAll(
                ".quickPostponePreset"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    try {

                        this.callbacks
                            .onQuickPostponeTask(
                                button.closest(
                                    ".quickPostpone"
                                ).dataset.id,
                                button.dataset.date
                            );

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(
                ".applyQuickPostpone"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    const menu = button.closest(
                        ".quickPostpone"
                    );

                    const date = menu
                        .querySelector(
                            ".quickPostponeDate"
                        )
                        .value;

                    if (!date) {

                        Dialog.alert(
                            "Elegí una fecha."
                        );

                        return;

                    }

                    try {

                        this.callbacks
                            .onQuickPostponeTask(
                                menu.dataset.id,
                                date
                            );

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(
                ".quickAddSubtask"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    this.callbacks.onOpenInlineSubtask(
                        button.dataset.id
                    );

                });

            });

            document.querySelectorAll(
                ".inlineSubtaskForm"
            ).forEach(form => {

                form.addEventListener(
                    "click",
                    event => event.stopPropagation()
                );

                form.addEventListener("submit", event => {

                    event.preventDefault();
                    event.stopPropagation();

                    const input = form.querySelector(
                        ".inlineSubtaskTitle"
                    );

                    const title = input.value.trim();

                    if (!title) return;

                    try {

                        this.callbacks
                            .onCreateInlineSubtask(
                                form.dataset.parentId,
                                title
                            );

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(
                ".cancelInlineSubtask"
            ).forEach(button => {

                button.addEventListener("click", event => {

                    event.stopPropagation();

                    this.callbacks
                        .onCancelInlineSubtask();

                });

            });

            document.querySelectorAll(".task").forEach(item => {

                item.addEventListener("click", () => {

                    const hasSubtasks =
                        allTasks.some(
                            task =>
                                task.parentTaskId ===
                                item.dataset.id
                        );

                    if (hasSubtasks) {

                        this.callbacks.onOpenProject(
                            item.dataset.id
                        );

                        const content =
                            document.querySelector(
                                ".content"
                            );

                        if (content) {
                            content.scrollTop = 0;
                        }

                        window.scrollTo({
                            top: 0,
                            left: 0,
                            behavior: "auto"
                        });

                        return;

                    }

                    this.callbacks.onSelectTask(
                        item.dataset.id
                    );

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

                const recurrenceSelect =
                    document.getElementById(
                        "taskRecurrence"
                    );

                const updateRecurrenceControls =
                    () => {

                        if (!recurrenceSelect) {
                            return;
                        }

                        const frequency =
                            recurrenceSelect.value;

                        const advancedFields =
                            document.getElementById(
                                "recurrenceAdvancedFields"
                            );

                        const weekdays =
                            document.getElementById(
                                "recurrenceWeekdays"
                            );

                        const unit =
                            document.getElementById(
                                "recurrenceIntervalUnit"
                            );

                        if (advancedFields) {
                            advancedFields.hidden =
                                !frequency;
                        }

                        if (weekdays) {
                            weekdays.hidden =
                                frequency !==
                                    "WEEKLY";
                        }

                        if (unit) {

                            const units = {
                                DAILY:
                                    "día(s)",
                                WEEKLY:
                                    "semana(s)",
                                MONTHLY:
                                    "mes(es)"
                            };

                            unit.textContent =
                                units[frequency] ??
                                "unidad";
                        }

                    };

                recurrenceSelect
                    ?.addEventListener(
                        "change",
                        updateRecurrenceControls
                    );

                updateRecurrenceControls();

                document.getElementById(
                    "closeTaskEditor"
                )?.addEventListener("click", () => {

                    if (
                        !this.confirmDiscardTaskChanges(
                            selectedTask
                        )
                    ) {
                        return;
                    }

                    this.callbacks
                        .onCloseTaskEditor();

                });

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
                        .from(document.querySelectorAll(".taskTag"))
                        .map(input => input.value);

                    const goalIds = Array
                        .from(document.querySelectorAll(".taskGoal"))
                        .map(input => input.value);

                    const recurrence =
                        document.getElementById(
                            "taskRecurrence"
                        ).value || null;

                    const recurrenceInterval =
                        recurrence
                            ? Number(
                                document.getElementById(
                                    "taskRecurrenceInterval"
                                ).value
                            )
                            : 1;

                    const recurrenceWeekdays =
                        recurrence === "WEEKLY"
                            ? [
                                ...document
                                    .querySelectorAll(
                                        ".taskRecurrenceWeekday:checked"
                                    )
                            ].map(
                                input =>
                                    Number(
                                        input.value
                                    )
                            )
                            : [];

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
                            goalIds,
                            recurrence,
                            recurrenceInterval,
                            recurrenceWeekdays

                        });

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

                document.getElementById(
                    "saveTaskMobile"
                )?.addEventListener(
                    "click",
                    () => {

                        document.getElementById(
                            "saveTask"
                        )?.click();

                    }
                );

                document.getElementById(
                    "moveTaskFromEditor"
                )?.addEventListener(
                    "click",
                    () => {

                        const targetId = document
                            .getElementById(
                                "taskMoveTarget"
                            )
                            .value;

                        if (!targetId) {
                            Dialog.alert(
                                "Elegí un destino."
                            );
                            return;
                        }

                        if (
                            hasTaskEditorChanges(
                                selectedTask
                            )
                        ) {
                            Dialog.alert(
                                "Guardá los cambios de la tarea antes de moverla."
                            );
                            return;
                        }

                        if (!Dialog.confirm(
                            targetId === "__ROOT__"
                                ? "¿Convertir esta subtarea en una tarea principal?"
                                : "¿Mover esta tarea y todo su árbol al proyecto seleccionado?"
                        )) {
                            return;
                        }

                        try {

                            if (targetId === "__ROOT__") {
                                this.callbacks
                                    .onDetachSubtask(
                                        selectedTask.id
                                    );
                            } else {
                                this.callbacks
                                    .onMoveTaskToProject(
                                        selectedTask.id,
                                        targetId
                                    );
                            }

                        } catch (error) {
                            Dialog.alert(error.message);
                        }

                    }
                );

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

            document.querySelectorAll(
                ".editEntity"
            ).forEach(button => {

                button.addEventListener("click", () => {

                    const item = button.closest(
                        ".entityItem"
                    );

                    item.querySelector(
                        ".entityDisplay"
                    ).hidden = true;

                    const form = item.querySelector(
                        ".entityEditForm"
                    );

                    form.hidden = false;

                    form.querySelector(
                        ".entityEditName"
                    ).focus();

                });

            });

            document.querySelectorAll(
                ".cancelEntityEdit"
            ).forEach(button => {

                button.addEventListener("click", () => {

                    const item = button.closest(
                        ".entityItem"
                    );

                    item.querySelector(
                        ".entityEditForm"
                    ).hidden = true;

                    item.querySelector(
                        ".entityDisplay"
                    ).hidden = false;

                });

            });

            document.querySelectorAll(
                ".entityEditForm"
            ).forEach(form => {

                const saveEntity = () => {

                    const entity =
                        config.entities.find(
                            entity =>
                                entity.id ===
                                    form.dataset.id
                        );

                    if (!entity) return;

                    const name =
                        form.querySelector(
                            ".entityEditName"
                        ).value.trim();

                    const color =
                        form.querySelector(
                            ".entityEditColor"
                        ).value;

                    if (!name) return;

                    try {

                        config.update(
                            entity.id,
                            name,
                            color
                        );

                    } catch (error) {

                        Dialog.alert(
                            error.message
                        );

                    }

                };

                form.addEventListener(
                    "submit",
                    event => {

                        event.preventDefault();

                    }
                );

                form.querySelector(
                    ".saveEntityEdit"
                ).addEventListener(
                    "click",
                    saveEntity
                );

                form.querySelector(
                    ".entityEditName"
                ).addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key !==
                            "Enter"
                        ) {
                            return;
                        }

                        event.preventDefault();
                        saveEntity();

                    }
                );

            });;

        }
    }

}
