import { Sidebar } from "./Sidebar.js";
import { TaskEditor } from "./TaskEditor.js";
import { GoalEditor } from "./GoalEditor.js";
import { ViewRouter } from "./ViewRouter.js";
import { View } from "../core/View.js";
import { Dialog } from "../components/Dialog.js";
import { ColorSelector } from "./ColorSelector.js";
import { TaskSwipeController } from "./TaskSwipeController.js";
import { hasTaskEditorChanges } from "./TaskEditorDraft.js";
import { SearchableSelect } from "./SearchableSelect.js";
import {
    SearchableMultiSelect
} from "./SearchableMultiSelect.js";
import { Icon } from "./Icon.js";

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
        this.mobileHistoryGuardArmed =
            false;
        this.mobileBackActivationBound =
            false;

    }

    captureScrollState() {

        const selectors = [
            "#appSidebar",
            ".content",
            ".taskDrawer",
            "#advancedSearchDialog",
            "#taskToolsDialog",
            "#settingsDialog"
        ];

        return {
            containers: selectors.map(selector => {

                const element =
                    document.querySelector(selector);

                return {
                    selector,
                    existed: Boolean(element),
                    top: element?.scrollTop ?? 0,
                    left: element?.scrollLeft ?? 0
                };

            }),
            mobileMenuOpen: Boolean(
                document.querySelector(".layout")
                    ?.classList.contains(
                        "mobileMenuOpen"
                    )
            ),
            windowX: window.scrollX,
            windowY: window.scrollY
        };

    }

    restoreScrollState(scrollState) {

        if (!scrollState) return;

        for (const position of scrollState.containers) {

            const element = document.querySelector(
                position.selector
            );

            if (!element) continue;

            element.scrollTop = position.top;
            element.scrollLeft = position.left;

            if (
                position.selector === ".taskDrawer" &&
                position.existed
            ) {
                element.classList.add(
                    "taskDrawerRestored"
                );
            }

        }

        window.scrollTo({
            top: scrollState.windowY,
            left: scrollState.windowX,
            behavior: "auto"
        });

    }

    restoreMobileMenuState(scrollState) {

        if (!scrollState?.mobileMenuOpen) return;

        document.querySelector(".layout")
            ?.classList.add("mobileMenuOpen");
        document.getElementById(
            "toggleMobileMenu"
        )?.setAttribute(
            "aria-expanded",
            "true"
        );

    }

    scheduleFinalScrollRestore(scrollState) {

        const restoreId =
            (this.scrollRestoreId ?? 0) + 1;

        this.scrollRestoreId = restoreId;

        const restoreIfCurrent = () => {

            if (
                this.scrollRestoreId !== restoreId
            ) {
                return;
            }

            this.restoreScrollState(scrollState);

        };

        queueMicrotask(() => {

            restoreIfCurrent();

            const scheduleFrame =
                globalThis.window
                    ?.requestAnimationFrame
                    ?.bind(globalThis.window);

            if (!scheduleFrame) return;

            scheduleFrame(() => {

                restoreIfCurrent();
                scheduleFrame(restoreIfCurrent);

            });

        });

    }

    captureActiveControlState() {

        const control = document.activeElement;
        const appRoot = document.getElementById("app");

        if (
            !control ||
            !appRoot ||
            typeof appRoot.contains !== "function" ||
            !appRoot.contains(control)
        ) {
            return null;
        }

        const locator = this.createElementLocator(
            control
        );

        if (!locator) return null;

        const preservesFormValue = [
            "INPUT",
            "TEXTAREA",
            "SELECT"
        ].includes(control.tagName);
        const preservesCheckedState =
            control.tagName === "INPUT" &&
            ["checkbox", "radio"].includes(
                control.type
            );

        const state = {
            locator,
            value:
                preservesFormValue
                    ? control.value
                    : null,
            checked:
                preservesCheckedState
                    ? control.checked
                    : null,
            selectionStart:
                typeof control.selectionStart ===
                    "number"
                    ? control.selectionStart
                    : null,
            selectionEnd:
                typeof control.selectionEnd ===
                    "number"
                    ? control.selectionEnd
                    : null,
            selectionDirection:
                control.selectionDirection ?? null,
            openAncestor:
                this.createElementLocator(
                    control.closest?.("details[open]")
                )
        };

        return state;

    }

    createElementLocator(element) {

        if (!element) return null;

        if (element.id) {
            return {
                kind: "id",
                id: element.id
            };
        }

        const anchor = element.closest?.(
            "[data-parent-id], [data-picker-id], [data-searchable-select-id], [data-id]"
        );

        if (!anchor) return null;

        const dataKey = [
            "parentId",
            "pickerId",
            "searchableSelectId",
            "id"
        ].find(key =>
            anchor.dataset?.[key] !== undefined
        );

        if (!dataKey) return null;

        const candidates = Array.from(
            anchor.querySelectorAll(
                element.tagName.toLowerCase()
            )
        ).filter(candidate =>
            candidate.type === element.type &&
            candidate.className === element.className
        );

        return {
            kind: "anchored",
            anchorTag: anchor.tagName.toLowerCase(),
            dataKey,
            dataValue: anchor.dataset[dataKey],
            tagName: element.tagName.toLowerCase(),
            type: element.type ?? "",
            className: element.className ?? "",
            index: Math.max(
                0,
                candidates.indexOf(element)
            )
        };

    }

    findElement(locator) {

        if (!locator) return null;

        if (locator.kind === "id") {
            return document.getElementById(
                locator.id
            );
        }

        const anchors = Array.from(
            document.querySelectorAll(
                `${locator.anchorTag}[data-${this.toKebabCase(locator.dataKey)}]`
            )
        );
        const anchor = anchors.find(candidate =>
            candidate.dataset?.[locator.dataKey] ===
                locator.dataValue
        );

        if (!anchor) return null;

        const candidates = Array.from(
            anchor.querySelectorAll(
                locator.tagName
            )
        ).filter(candidate =>
            candidate.type === locator.type &&
            candidate.className === locator.className
        );

        return candidates[locator.index] ?? null;

    }

    toKebabCase(value) {

        return String(value).replace(
            /[A-Z]/g,
            letter => `-${letter.toLowerCase()}`
        );

    }

    restoreActiveControlState(state) {

        if (!state) return;

        const openAncestor = this.findElement(
            state.openAncestor
        );

        if (openAncestor) {
            openAncestor.open = true;
        }

        const control = this.findElement(
            state.locator
        );

        if (!control || control.disabled) return;

        let valueChanged = false;

        if (
            state.value !== null &&
            "value" in control
        ) {
            valueChanged =
                control.value !== state.value;
            control.value = state.value;
        }

        if (
            state.checked !== null &&
            "checked" in control
        ) {
            valueChanged =
                valueChanged ||
                control.checked !== state.checked;
            control.checked = state.checked;
        }

        if (
            valueChanged &&
            typeof control.dispatchEvent ===
                "function" &&
            typeof globalThis.Event ===
                "function"
        ) {
            control.dispatchEvent(
                new Event("input", {
                    bubbles: true
                })
            );
        }

        try {
            control.focus({
                preventScroll: true
            });
        } catch {
            control.focus?.();
        }

        if (
            state.selectionStart !== null &&
            state.selectionEnd !== null &&
            typeof control.setSelectionRange ===
                "function"
        ) {
            control.setSelectionRange(
                state.selectionStart,
                state.selectionEnd,
                state.selectionDirection ?? undefined
            );
        }

    }

    render(state) {

        const scrollState =
            this.captureScrollState();
        const activeControlState =
            this.captureActiveControlState();

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
            advancedSearchDialogOpen,
            taskToolsDialogOpen,
            settingsDialogOpen,
            settingsSection,
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
            showCompletedTasks,
            showTaskMetadata,
            taskViewCounts,
            sidebarTitle,
            sidebarTitleSaved
        } = state;

        const applicationTitle =
            String(sidebarTitle).trim() ||
            "Mis tareas";

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
                        ${Icon.render("menu")}
                    </button>

                    <strong>${escapeHtml(applicationTitle)}</strong>

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
                    currentCustomFilterId,
                    taskViewCounts,
                    advancedSearchDialogOpen,
                    taskToolsDialogOpen,
                    showTaskMetadata,
                    settingsDialogOpen,
                    settingsSection,
                    sidebarTitle,
                    sidebarTitleSaved
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

        const advancedSearchDialog =
            document.getElementById(
                "advancedSearchDialog"
            );

        if (
            advancedSearchDialogOpen &&
            advancedSearchDialog &&
            !advancedSearchDialog.open
        ) {
            advancedSearchDialog.showModal();
        }

        const taskToolsDialog =
            document.getElementById(
                "taskToolsDialog"
            );

        if (
            taskToolsDialogOpen &&
            taskToolsDialog &&
            !taskToolsDialog.open
        ) {

            if (
                window.matchMedia(
                    "(max-width: 760px)"
                ).matches
            ) {
                taskToolsDialog.showModal();
            } else {
                taskToolsDialog.show();
            }

        }

        const settingsDialog =
            document.getElementById(
                "settingsDialog"
            );

        if (
            settingsDialogOpen &&
            settingsDialog &&
            !settingsDialog.open
        ) {

            if (
                window.matchMedia(
                    "(max-width: 760px)"
                ).matches
            ) {
                settingsDialog.showModal();
            } else {
                settingsDialog.show();
            }

        }

        this.searchableMultiSelect.bind(
            "bulkTagPicker"
        );
        this.searchableMultiSelect.bind(
            "bulkGoalPicker"
        );
        this.bindEvents(state);

        const calendarDayDialog =
            document.getElementById(
                "calendarDayDialog"
            );

        if (
            calendarDayDialog &&
            !calendarDayDialog.open
        ) {
            calendarDayDialog.showModal();
        }

        this.restoreMobileMenuState(scrollState);
        this.restoreScrollState(scrollState);
        this.restoreActiveControlState(
            activeControlState
        );
        this.scheduleFinalScrollRestore(
            scrollState
        );

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

    hasActiveTransientForm(goal) {

        if (this.hasUnsavedGoalEdit(goal)) {
            return true;
        }

        const activeElement =
            document.activeElement;
        const activeOnlyForms =
            document.querySelectorAll(
                ".customFilterRenameForm:not([hidden])"
            );

        if (
            Array.from(activeOnlyForms).some(
                form => form.contains?.(
                    activeElement
                )
            )
        ) {
            return true;
        }

        return [
            document.getElementById("goalForm"),
            document.querySelector(
                ".inlineSubtaskForm"
            )
        ].some(form => {

            if (!form) return false;

            if (form.contains?.(activeElement)) {
                return true;
            }

            return Array.from(
                form.querySelectorAll(
                    "input:not([type='hidden']), textarea"
                )
            ).some(control =>
                String(control.value ?? "").trim()
            );

        });

    }

    hasUnsavedGoalEdit(goal) {

        const form = document.getElementById(
            "goalEditorForm"
        );

        if (!goal || !form) return false;

        return (
            document.getElementById(
                "goalTitleEdit"
            )?.value !== goal.title ||
            document.getElementById(
                "goalDescriptionEdit"
            )?.value !== goal.description ||
            document.getElementById(
                "goalDueDateEdit"
            )?.value !== (goal.dueDate ?? "")
        );

    }

    hasUnsavedTaskEdit(task) {

        return Boolean(
            task &&
            hasTaskEditorChanges(task)
        );

    }

    async confirmDiscardTaskChanges(task) {

        if (
            !this.hasUnsavedTaskEdit(task)
        ) {
            return true;
        }

        return Dialog.confirmAsync(
            "Hay cambios sin guardar. ¿Querés descartarlos?",
            {
                title: "Descartar cambios",
                confirmLabel: "Descartar",
                variant: "danger"
            }
        );

    }

    clearTaskEditorEscapeBinding() {

        if (!this.taskEditorEscapeHandler) {
            return;
        }

        document.removeEventListener(
            "keydown",
            this.taskEditorEscapeHandler
        );
        this.taskEditorEscapeHandler = null;

    }

    bindTaskEditorDismissal(task) {

        this.clearTaskEditorEscapeBinding();

        if (!task) {
            return;
        }

        const dismiss = async () => {

            if (!await this.confirmDiscardTaskChanges(task)) {
                return;
            }

            this.callbacks.onCloseTaskEditor();

        };

        document.getElementById(
            "taskEditorBackdrop"
        )?.addEventListener("click", dismiss);

        document.getElementById(
            "closeTaskEditor"
        )?.addEventListener("click", dismiss);

        this.taskEditorEscapeHandler = event => {

            if (
                event.key !== "Escape" ||
                document.querySelector("dialog[open]")
            ) {
                return;
            }

            event.preventDefault();
            dismiss();

        };

        document.addEventListener(
            "keydown",
            this.taskEditorEscapeHandler
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

    closeMobileMenu() {

        document.querySelector(".layout")
            ?.classList.remove(
                "mobileMenuOpen"
            );

        document.getElementById(
            "toggleMobileMenu"
        )?.setAttribute(
            "aria-expanded",
            "false"
        );

    }

    navigateFromSidebar(callback) {

        this.closeMobileMenu();
        this.navigateAndResetScroll(callback);

    }

    preserveContentScroll(callback) {

        const content =
            document.querySelector(".content");
        const contentScrollTop =
            content?.scrollTop ?? 0;
        const windowScrollX = window.scrollX;
        const windowScrollY = window.scrollY;

        callback();

        const renderedContent =
            document.querySelector(".content");

        if (renderedContent) {
            renderedContent.scrollTop =
                contentScrollTop;
        }

        window.scrollTo({
            top: windowScrollY,
            left: windowScrollX,
            behavior: "auto"
        });

    }

    setupMobileBackNavigation(state) {

        const mobileViewport =
            window.matchMedia(
                "(max-width: 760px)"
            ).matches;
        const standaloneApp =
            window.matchMedia(
                "(display-mode: standalone)"
            ).matches ||
            window.navigator?.standalone === true;

        if (!mobileViewport && !standaloneApp) {
            return;
        }

        const guardKey =
            "taskEngineMobileGuard";

        const armGuard = () => {

            if (this.mobileHistoryGuardArmed) {
                return;
            }

            window.history.pushState(
                { [guardKey]: true },
                ""
            );

            this.mobileHistoryGuardArmed =
                true;

        };

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

            this.mobileHistoryInitialized =
                true;

        }

        if (!this.mobileBackActivationBound) {

            const activationOptions = {
                capture: true,
                once: true
            };

            document.addEventListener(
                "pointerdown",
                armGuard,
                activationOptions
            );
            document.addEventListener(
                "touchstart",
                armGuard,
                {
                    ...activationOptions,
                    passive: true
                }
            );
            document.addEventListener(
                "keydown",
                armGuard,
                activationOptions
            );

            this.mobileBackActivationBound =
                true;

        }

        if (
            window.navigator?.userActivation
                ?.hasBeenActive
        ) {
            armGuard();
        }

        window.onpopstate = async () => {

            this.mobileHistoryGuardArmed =
                false;

            const restoreGuard = () => {
                armGuard();
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
                    !await this.confirmDiscardTaskChanges(
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
                !await Dialog.confirmAsync(
                    "Android puede requerir que presiones Atrás una vez más después de confirmar. ¿Querés continuar?",
                    {
                        title: "Salir de la aplicación",
                        confirmLabel: "Continuar"
                    }
                )
            ) {

                restoreGuard();
                return;

            }

            window.onpopstate = null;
            window.history.back();

        };

    }

    async toggleTaskWithAssistedParentCompletion(
        id,
        {
            offerParentCompletion = true
        } = {}
    ) {

        try {

            const parent =
                this.callbacks.onToggleTask(id);

            if (
                !offerParentCompletion ||
                !parent
            ) {
                return true;
            }

            const completeParent =
                await Dialog.confirmAsync(
                    `Completaste todas las subtareas de “${parent.title}”. ¿Querés completar también el proyecto?`,
                    {
                        title: "Completar proyecto",
                        confirmLabel: "Completar proyecto"
                    }
                );

            if (completeParent) {
                this.callbacks.onToggleTask(
                    parent.id
                );
            }

            return true;

        } catch (error) {

            Dialog.alert(error.message);
            return false;

        }

    }

    undoTaskCompletion(id) {

        try {

            this.callbacks
                .onUndoTaskCompletion(id);

            return true;

        } catch (error) {

            Dialog.alert(error.message);
            return false;

        }

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
            settingsSection,
            syncPendingChanges,
            syncRemoteUpdateAvailable
        } = state;

        this.clearTaskEditorEscapeBinding();

        if (selectedTask) {
            this.bindTaskEditorDismissal(
                selectedTask
            );
        }

        this.taskSwipeController.bind({
            onComplete: id =>
                this.toggleTaskWithAssistedParentCompletion(
                    id
                ),
            onUndoComplete: id =>
                this.undoTaskCompletion(id)
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

            this.closeMobileMenu();

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

        document.getElementById("clearSyncConfig")?.addEventListener("click", async () => {

            if (!await Dialog.confirmAsync(
                "¿Quitar la conexión? Los datos locales no se eliminarán.",
                {
                    title: "Quitar conexión",
                    confirmLabel: "Quitar",
                    variant: "danger"
                }
            )) {
                return;
            }

            this.callbacks.onClearSyncConfig();

        });

        document.getElementById("pushToCloud")?.addEventListener("click", async () => {

            if (!await Dialog.confirmAsync(
                "¿Subir el estado local completo a Google Sheets?",
                {
                    title: "Subir a la nube",
                    confirmLabel: "Subir"
                }
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

            if (!await Dialog.confirmAsync(
                conflict
                    ? "Hay cambios locales y remotos. Conservar la versión de la nube reemplazará los datos locales, pero guardará una copia para poder deshacerlo. ¿Continuar?"
                    : "La descarga reemplazará los datos locales y guardará una copia para poder deshacerla. ¿Continuar?",
                {
                    title: "Descargar de la nube",
                    confirmLabel: "Descargar",
                    variant: "danger"
                }
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

            if (!await Dialog.confirmAsync(
                "Hay cambios locales y remotos. Conservar la versión local reemplazará en la nube los cambios hechos en otro dispositivo. Esta decisión no se puede deshacer desde la nube. ¿Continuar?",
                {
                    title: "Sobrescribir la nube",
                    confirmLabel: "Sobrescribir",
                    variant: "danger"
                }
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

            if (!await Dialog.confirmAsync(
                "La importación reemplazará los datos actuales. Se guardará una copia para poder deshacerla. ¿Continuar?",
                {
                    title: "Importar copia de seguridad",
                    confirmLabel: "Importar",
                    variant: "danger"
                }
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

        document.getElementById("restoreLastImportBackup")?.addEventListener("click", async () => {

            if (!await Dialog.confirmAsync(
                "¿Restaurar los datos anteriores a la última importación?",
                {
                    title: "Restaurar copia anterior",
                    confirmLabel: "Restaurar"
                }
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

            this.callbacks.onSearchSimpleTasks(query);

        });

        document.getElementById(
            "advancedSearchForm"
        )?.addEventListener("submit", event => {

            event.preventDefault();

            const query = document
                .getElementById(
                    "advancedSearchInput"
                )
                .value;

            this.callbacks.onSearchTasks(query);

        });

        const closeAdvancedSearch = () => {

            this.callbacks
                .onCloseAdvancedSearch();

        };

        document.getElementById(
            "closeAdvancedSearch"
        )?.addEventListener(
            "click",
            closeAdvancedSearch
        );

        document.getElementById(
            "cancelAdvancedSearch"
        )?.addEventListener(
            "click",
            closeAdvancedSearch
        );

        document.getElementById(
            "advancedSearchDialog"
        )?.addEventListener(
            "cancel",
            event => {

                event.preventDefault();
                closeAdvancedSearch();

            }
        );

        document.getElementById(
            "openTaskTools"
        )?.addEventListener(
            "click",
            () => {

                this.callbacks.onOpenTaskTools();

            }
        );

        const closeTaskTools = () => {

            this.callbacks.onCloseTaskTools();

        };

        document.getElementById(
            "closeTaskTools"
        )?.addEventListener(
            "click",
            closeTaskTools
        );

        document.getElementById(
            "cancelTaskTools"
        )?.addEventListener(
            "click",
            closeTaskTools
        );

        document.getElementById(
            "taskToolsDialog"
        )?.addEventListener(
            "cancel",
            event => {

                event.preventDefault();
                closeTaskTools();

            }
        );

        document.getElementById("clearTaskSearch")?.addEventListener("click", () => {

            this.callbacks.onClearSearch();

        });

        document.getElementById(
            "clearActiveAdvancedSearch"
        )?.addEventListener("click", () => {

            this.callbacks.onClearSearch();

        });

        document.getElementById(
            "saveCustomFilter"
        )?.addEventListener("click", async () => {

            const name = await Dialog.promptAsync(
                "Elegí un nombre para identificar esta búsqueda.",
                {
                    title: "Guardar filtro personalizado",
                    inputLabel: "Nombre del filtro",
                    confirmLabel: "Guardar"
                }
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
            "openGoalTaskCreation"
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

        document.getElementById(
            "openSettings"
        )?.addEventListener("click", () => {

            this.callbacks.onOpenSettings();

        });

        const closeSettings = () => {

            this.callbacks.onCloseSettings();

        };

        document.getElementById(
            "closeSettings"
        )?.addEventListener("click", closeSettings);

        document.getElementById(
            "cancelSettings"
        )?.addEventListener("click", closeSettings);

        document.getElementById(
            "backSettings"
        )?.addEventListener("click", () => {

            this.callbacks.onBackSettings();

        });

        document.querySelectorAll(
            ".openSettingsSection"
        ).forEach(button => {

            button.addEventListener("click", () => {

                this.callbacks.onOpenSettingsSection(
                    button.dataset.section
                );

            });

        });

        document.getElementById(
            "settingsDialog"
        )?.addEventListener("cancel", event => {

            event.preventDefault();
            closeSettings();

        });

        document.getElementById(
            "sidebarTitleForm"
        )?.addEventListener("submit", event => {

            event.preventDefault();

            this.callbacks.onSaveSidebarTitle(
                document.getElementById(
                    "sidebarTitle"
                ).value
            );

        });

        document.getElementById(
            "sidebarTitle"
        )?.addEventListener("input", () => {

            const saveButton =
                document.getElementById(
                    "sidebarTitleSaveButton"
                );

            const saveStatus =
                document.getElementById(
                    "sidebarTitleSaveStatus"
                );

            if (saveButton) {
                saveButton.textContent =
                    "Guardar nombre";
            }

            if (saveStatus) {
                saveStatus.hidden = true;
            }

        });

        const navigationActions = [
            ["showInbox", "onShowInbox"],
            ["showToday", "onShowToday"],
            ["showTomorrow", "onShowTomorrow"],
            ["showUpcoming", "onShowUpcoming"],
            ["showAll", "onShowAll"],
            ["showProjects", "onShowProjects"],
            ["showCalendar", "onShowCalendar"],
            ["showActivity", "onShowActivity"],
            ["showStatistics", "onShowStatistics"],
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
            )?.addEventListener("click", async () => {

                if (
                    selectedTask &&
                    !await this.confirmDiscardTaskChanges(
                        selectedTask
                    )
                ) {
                    return;
                }

                this.navigateFromSidebar(
                    () =>
                        this.callbacks[
                            callbackName
                        ]()
                );

            });

        }

        document.getElementById(
            "statisticsPeriod"
        )?.addEventListener("change", event => {

            this.callbacks.onChangeStatisticsPeriod(
                event.target.value
            );

        });

        document.querySelectorAll(
            ".openStatisticsProject"
        ).forEach(button => {

            button.addEventListener("click", () => {

                this.callbacks.onOpenProject(
                    button.dataset.id
                );

            });

        });

        document.querySelectorAll(
            ".openStatisticsGoal"
        ).forEach(button => {

            button.addEventListener("click", () => {

                this.callbacks.onSelectGoal(
                    button.dataset.id
                );

            });

        });

        document.getElementById(
            "activitySearchForm"
        )?.addEventListener("submit", event => {

            event.preventDefault();
            this.callbacks.onSearchActivity(
                document.getElementById(
                    "activitySearch"
                )?.value ?? ""
            );

        });

        document.getElementById(
            "activityCategory"
        )?.addEventListener("change", event => {

            this.callbacks.onFilterActivity(
                event.target.value
            );

        });

        document.querySelectorAll(
            ".openActivityTask"
        ).forEach(button => {

            button.addEventListener("click", () => {

                this.callbacks.onOpenActivityTask(
                    button.dataset.taskId
                );

            });

        });

        if (view === View.GOAL) {

            document.getElementById(
                "goalBreadcrumbRoot"
            )?.addEventListener("click", () => {

                this.callbacks.onCloseGoalWorkspace();

            });

            document.querySelectorAll(
                ".goalBreadcrumbGoal"
            ).forEach(button => {

                button.addEventListener("click", () => {

                    this.callbacks.onSelectGoal(
                        button.dataset.id
                    );

                });

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
                        async () => {

                            if (
                                className ===
                                    "permanentlyDeleteGoal"
                            ) {
                                if (!await Dialog.confirmAsync(
                                    "Se eliminarán definitivamente este objetivo y sus subobjetivos. Las tareas se conservarán, pero dejarán de estar asociadas. ¿Querés continuar?",
                                    {
                                        title: "Eliminar objetivo",
                                        confirmLabel: "Continuar",
                                        variant: "danger"
                                    }
                                )) {
                                    return;
                                }

                                if (!await Dialog.confirmAsync(
                                    "Esta acción no puede deshacerse. ¿Confirmás la eliminación definitiva?",
                                    {
                                        title: "Confirmación definitiva",
                                        confirmLabel:
                                            "Eliminar definitivamente",
                                        variant: "danger"
                                    }
                                )) {
                                    return;
                                }
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

        if (view === View.CALENDAR) {

            document.getElementById(
                "previousCalendarMonth"
            )?.addEventListener(
                "click",
                () => this.callbacks
                    .onChangeCalendarMonth(-1)
            );

            document.getElementById(
                "nextCalendarMonth"
            )?.addEventListener(
                "click",
                () => this.callbacks
                    .onChangeCalendarMonth(1)
            );

            document.querySelectorAll(
                ".calendarDay.hasPendingTasks"
            ).forEach(button => {
                button.addEventListener(
                    "click",
                    () => this.callbacks
                        .onOpenCalendarDay(
                            button.dataset.date
                        )
                );
            });

            const closeCalendarDay = () =>
                this.callbacks.onCloseCalendarDay();

            document.getElementById(
                "closeCalendarDay"
            )?.addEventListener(
                "click",
                closeCalendarDay
            );
            document.getElementById(
                "closeCalendarDayAction"
            )?.addEventListener(
                "click",
                closeCalendarDay
            );
            document.getElementById(
                "calendarDayDialog"
            )?.addEventListener(
                "cancel",
                event => {
                    event.preventDefault();
                    closeCalendarDay();
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
                async () => {

                    if (!await Dialog.confirmAsync(
                        "¿Marcar este objetivo como completado?",
                        {
                            title: "Completar objetivo",
                            confirmLabel: "Completar"
                        }
                    )) {
                        return;
                    }

                    this.callbacks
                        .onCompleteGoal(
                            selectedGoal.id
                        );

                }
            );

            document.getElementById(
                "archiveGoal"
            )?.addEventListener(
                "click",
                async () => {

                    if (!await Dialog.confirmAsync(
                        "¿Archivar este objetivo?",
                        {
                            title: "Archivar objetivo",
                            confirmLabel: "Archivar"
                        }
                    )) {
                        return;
                    }

                    this.callbacks
                        .onArchiveGoal(
                            selectedGoal.id
                        );

                }
            );

            document.getElementById(
                "deleteGoalFromEditor"
            )?.addEventListener(
                "click",
                async () => {

                    if (!await Dialog.confirmAsync(
                        "¿Mover este objetivo y sus subobjetivos a la papelera?",
                        {
                            title: "Mover objetivo a la papelera",
                            confirmLabel: "Mover a la papelera",
                            variant: "danger"
                        }
                    )) {
                        return;
                    }

                    this.callbacks.onDeleteGoal(
                        selectedGoal.id
                    );

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
                async () => {

                    if (
                        selectedTask &&
                        !await this.confirmDiscardTaskChanges(
                            selectedTask
                        )
                    ) {
                        return;
                    }

                    this.navigateFromSidebar(
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
                async () => {

                    if (
                        selectedTask &&
                        !await this.confirmDiscardTaskChanges(
                            selectedTask
                        )
                    ) {
                        return;
                    }

                    this.navigateFromSidebar(
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
                async () => {

                    if (!await Dialog.confirmAsync(
                        "¿Eliminar este filtro personalizado?",
                        {
                            title: "Eliminar filtro",
                            confirmLabel: "Eliminar",
                            variant: "danger"
                        }
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
            View.TOMORROW,
            View.UPCOMING,
            View.ALL,
            View.PROJECTS,
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
                    async () => {

                        const succeeded =
                            await this
                                .toggleTaskWithAssistedParentCompletion(
                                    checkbox.dataset.id
                                );

                        if (!succeeded) {
                            checkbox.checked = false;
                            return;
                        }

                        this.taskSwipeController
                            .showCompletionNotice(
                                checkbox.dataset.id,
                                id =>
                                    this.undoTaskCompletion(id)
                            );

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

                        this.preserveContentScroll(
                            () =>
                                this.callbacks
                                    .onToggleBulkSelection(
                                        checkbox.dataset.id,
                                        checkbox.checked
                                    )
                        );

                    }
                );

            });

            const bulkSelectAll =
                document.getElementById(
                    "bulkSelectAll"
                );

            if (bulkSelectAll) {

                bulkSelectAll.indeterminate =
                    bulkSelectAll.dataset
                        .indeterminate === "true";

                bulkSelectAll.addEventListener(
                    "change",
                    () => {

                        const visibleIds = [
                            ...document.querySelectorAll(
                                ".bulkTaskCheckbox"
                            )
                        ].map(
                            checkbox =>
                                checkbox.dataset.id
                        );

                        this.preserveContentScroll(
                            () =>
                                this.callbacks
                                    .onSetVisibleBulkSelection(
                                        visibleIds,
                                        bulkSelectAll.checked
                                    )
                        );

                    }
                );

            }

            document.getElementById(
                "clearBulkSelection"
            )?.addEventListener("click", () => {

                this.callbacks
                    .onClearBulkSelection();

            });

            document.getElementById(
                "bulkRestoreTasks"
            )?.addEventListener("click", async () => {

                const action =
                    view === View.COMPLETED
                        ? "reactivar"
                        : "restaurar";

                if (!await Dialog.confirmAsync(
                    `¿${action === "reactivar" ? "Reactivar" : "Restaurar"} las tareas seleccionadas y sus subtareas?`,
                    {
                        title: `${action === "reactivar" ? "Reactivar" : "Restaurar"} tareas`,
                        confirmLabel: action === "reactivar"
                            ? "Reactivar"
                            : "Restaurar"
                    }
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

                const dueTime = document
                    .getElementById(
                        "bulkDueTime"
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
                    changes.dueTime =
                        dueTime || null;
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

            const bulkMoveDialog =
                document.getElementById(
                    "bulkMoveDialog"
                );

            document.getElementById(
                "openBulkMoveDialog"
            )?.addEventListener("click", () => {
                bulkMoveDialog?.showModal();
            });

            document.getElementById(
                "cancelBulkMoveDialog"
            )?.addEventListener("click", () => {
                bulkMoveDialog?.close();
            });

            document.getElementById(
                "bulkMoveTasks"
            )?.addEventListener("click", async () => {

                const targetId = document
                    .getElementById("bulkMoveTarget")
                    ?.value;

                if (!targetId) {
                    Dialog.alert("Elegí un destino.");
                    return;
                }

                const detachTasks = targetId === "__ROOT__";

                if (!await Dialog.confirmAsync(
                    detachTasks
                        ? "¿Convertir las tareas seleccionadas en tareas principales?"
                        : "¿Mover las tareas seleccionadas y sus árboles al proyecto elegido?",
                    {
                        title: "Mover tareas",
                        confirmLabel: "Mover"
                    }
                )) {
                    return;
                }

                try {
                    const count = this.callbacks
                        .onBulkMoveTasks(
                            detachTasks ? null : targetId
                        );

                    bulkMoveDialog?.close();
                    Dialog.alert(
                        `Se movieron ${count} ${count === 1 ? "tarea" : "tareas"}.`
                    );
                } catch (error) {
                    Dialog.alert(error.message);
                }

            });

            const bulkDueDate =
                document.getElementById(
                    "bulkDueDate"
                );
            const bulkDueTime =
                document.getElementById(
                    "bulkDueTime"
                );

            bulkDueDate?.addEventListener(
                "change",
                () => {
                    const hasDate =
                        Boolean(bulkDueDate.value);

                    bulkDueTime.disabled =
                        !hasDate;

                    if (!hasDate) {
                        bulkDueTime.value = "";
                    }
                }
            );

            document.getElementById(
                "bulkCompleteTasks"
            )?.addEventListener("click", async () => {

                if (!await Dialog.confirmAsync(
                    "¿Completar todas las tareas seleccionadas?",
                    {
                        title: "Completar tareas",
                        confirmLabel: "Completar"
                    }
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
            )?.addEventListener("click", async () => {

                if (!await Dialog.confirmAsync(
                    "¿Archivar todas las tareas seleccionadas?",
                    {
                        title: "Archivar tareas",
                        confirmLabel: "Archivar"
                    }
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
            )?.addEventListener("click", async () => {

                if (!await Dialog.confirmAsync(
                    "¿Enviar a la papelera las tareas seleccionadas? Las subtareas descendientes también serán enviadas.",
                    {
                        title: "Enviar tareas a la papelera",
                        confirmLabel: "Enviar",
                        variant: "danger"
                    }
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
            )?.addEventListener("click", async () => {

                if (!await Dialog.confirmAsync(
                    "¿Eliminar definitivamente las tareas seleccionadas y sus subtareas? Esta acción no se puede deshacer.",
                    {
                        title: "Eliminar tareas definitivamente",
                        confirmLabel: "Continuar",
                        variant: "danger"
                    }
                )) {
                    return;
                }

                if (!await Dialog.confirmAsync(
                    "Confirmá nuevamente la eliminación definitiva. Las tareas no podrán recuperarse.",
                    {
                        title: "Confirmación final",
                        confirmLabel: "Eliminar definitivamente",
                        variant: "danger"
                    }
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
            )?.addEventListener("click", async () => {

                const count = allTasks.filter(
                    task => task.isDeleted()
                ).length;

                if (!await Dialog.confirmAsync(
                    `¿Eliminar definitivamente las ${count} ${count === 1 ? "tarea" : "tareas"} de la papelera? Esta acción no se puede deshacer.`,
                    {
                        title: "Vaciar papelera",
                        confirmLabel: "Continuar",
                        variant: "danger"
                    }
                )) {
                    return;
                }

                if (!await Dialog.confirmAsync(
                    "Confirmá nuevamente que querés vaciar la papelera. Las tareas no podrán recuperarse.",
                    {
                        title: "Confirmación final",
                        confirmLabel: "Vaciar definitivamente",
                        variant: "danger"
                    }
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

                button.addEventListener("click", async event => {

                    event.stopPropagation();

                    const id = button.closest(
                        ".quickMoreActions"
                    ).dataset.id;

                    const hasSubtasks =
                        allTasks.some(
                            task =>
                                task.parentTaskId === id
                        );

                    const isSubtask = Boolean(
                        allTasks.find(
                            task => task.id === id
                        )?.parentTaskId
                    );

                    const message = isSubtask
                        ? hasSubtasks
                            ? "¿Duplicar esta subtarea y todo su árbol dentro del mismo proyecto?"
                            : "¿Duplicar esta subtarea dentro del mismo proyecto?"
                        : hasSubtasks
                            ? "¿Duplicar esta tarea y todo su árbol como un proyecto nuevo?"
                            : "¿Duplicar esta tarea?";

                    if (!await Dialog.confirmAsync(
                        message,
                        {
                            title: "Duplicar tarea",
                            confirmLabel: "Duplicar"
                        }
                    )) {
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

                button.addEventListener("click", async event => {

                    event.stopPropagation();

                    if (!await Dialog.confirmAsync(
                        "¿Saltear esta instancia y avanzar a la próxima fecha?",
                        {
                            title: "Saltear recurrencia",
                            confirmLabel: "Saltear"
                        }
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

                button.addEventListener("click", async event => {

                    event.stopPropagation();

                    if (!await Dialog.confirmAsync(
                        "¿Finalizar la recurrencia? La tarea conservará su fecha actual, pero dejará de repetirse.",
                        {
                            title: "Finalizar recurrencia",
                            confirmLabel: "Finalizar"
                        }
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

                button.addEventListener("click", async event => {

                    event.stopPropagation();

                    if (!await Dialog.confirmAsync(
                        "¿Archivar esta tarea?",
                        {
                            title: "Archivar tarea",
                            confirmLabel: "Archivar"
                        }
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

                button.addEventListener("click", async event => {

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

                    if (!await Dialog.confirmAsync(
                        message,
                        {
                            title: "Mover a la papelera",
                            confirmLabel:
                                "Mover a la papelera",
                            variant: "danger"
                        }
                    )) {
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

                    const isProject =
                        item.classList.contains(
                            "projectTask"
                        );

                    if (isProject) {

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

                        const projectControl =
                            document.getElementById(
                                "taskIsProject"
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

                        if (
                            projectControl &&
                            frequency
                        ) {
                            projectControl.checked = false;
                            projectControl.disabled = true;
                        } else if (
                            projectControl &&
                            !selectedTask.isCompleted() &&
                            !allTasks.some(
                                task =>
                                    task.parentTaskId ===
                                    selectedTask.id
                            )
                        ) {
                            projectControl.disabled = false;
                        }

                    };

                recurrenceSelect
                    ?.addEventListener(
                        "change",
                        updateRecurrenceControls
                    );

                updateRecurrenceControls();

                document.getElementById(
                    "saveRecurrence"
                )?.addEventListener(
                    "click",
                    () => {
                        document.getElementById(
                            "saveTask"
                        )?.click();
                    }
                );

                document.getElementById(
                    "cancelRecurrence"
                )?.addEventListener(
                    "click",
                    () => {
                        if (!recurrenceSelect) {
                            return;
                        }

                        recurrenceSelect.value =
                            selectedTask.recurrence ?? "";

                        const interval =
                            document.getElementById(
                                "taskRecurrenceInterval"
                            );

                        if (interval) {
                            interval.value = String(
                                selectedTask
                                    .recurrenceInterval ?? 1
                            );
                        }

                        const selectedWeekdays =
                            new Set(
                                selectedTask
                                    .recurrenceWeekdays ?? []
                            );

                        document.querySelectorAll(
                            ".taskRecurrenceWeekday"
                        ).forEach(input => {
                            input.checked =
                                selectedWeekdays.has(
                                    Number(input.value)
                                );
                        });

                        updateRecurrenceControls();

                        const section =
                            recurrenceSelect.closest(
                                ".editorSection"
                            );

                        if (section) {
                            section.open = false;
                        }

                        section?.querySelector(
                            ":scope > summary"
                        )?.focus();
                    }
                );

                const taskDueDate =
                    document.getElementById(
                        "taskDueDate"
                    );
                const taskDueTime =
                    document.getElementById(
                        "taskDueTime"
                    );

                const updateDueTimeControl = () => {
                    if (!taskDueTime) return;
                    taskDueTime.disabled =
                        !taskDueDate?.value ||
                        taskDueDate.disabled;
                    if (!taskDueDate?.value) {
                        taskDueTime.value = "";
                    }
                };

                taskDueDate?.addEventListener(
                    "change",
                    updateDueTimeControl
                );
                updateDueTimeControl();

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

                document.getElementById(
                    "openParentTask"
                )?.addEventListener("click", async event => {

                    if (
                        !await this.confirmDiscardTaskChanges(
                            selectedTask
                        )
                    ) {
                        return;
                    }

                    this.callbacks.onOpenProject(
                        event.currentTarget.dataset.id
                    );

                });

                document.getElementById("toggleTask")?.addEventListener("click", () => {

                    this.toggleTaskWithAssistedParentCompletion(
                        selectedTask.id
                    );

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

                document.getElementById("skipRecurringTask")?.addEventListener("click", async () => {

                    if (!await Dialog.confirmAsync(
                        "¿Saltear esta vez y avanzar a la próxima fecha?",
                        {
                            title: "Saltear recurrencia",
                            confirmLabel: "Saltear esta vez"
                        }
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

                document.getElementById("archiveTask")?.addEventListener("click", async () => {

                    if (!await Dialog.confirmAsync(
                        "¿Archivar esta tarea?",
                        {
                            title: "Archivar tarea",
                            confirmLabel: "Archivar"
                        }
                    )) {
                        return;
                    }

                    try {

                        this.callbacks.onArchiveTask(selectedTask.id);

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

                document.getElementById("deleteTask")?.addEventListener("click", async () => {

                    const hasSubtasks = allTasks.some(
                        task => task.parentTaskId === selectedTask.id
                    );

                    const message = hasSubtasks
                        ? "¿Mover esta tarea y todas sus subtareas a la papelera?"
                        : "¿Mover esta tarea a la papelera?";

                    if (!await Dialog.confirmAsync(message, {
                        title: "Enviar a la papelera",
                        confirmLabel: "Enviar a la papelera",
                        variant: "danger"
                    })) {
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

                document.getElementById("permanentlyDeleteTask")?.addEventListener("click", async () => {

                    const hasSubtasks = allTasks.some(
                        task => task.parentTaskId === selectedTask.id
                    );

                    const message = hasSubtasks
                        ? "Esta acción no se puede deshacer. ¿Eliminar definitivamente esta tarea y todas sus subtareas?"
                        : "Esta acción no se puede deshacer. ¿Eliminar definitivamente esta tarea?";

                    if (!await Dialog.confirmAsync(message, {
                        title: "Eliminar tarea",
                        confirmLabel: "Continuar",
                        variant: "danger"
                    })) {
                        return;
                    }

                    if (!await Dialog.confirmAsync(
                        "Confirmá nuevamente la eliminación definitiva. La tarea no podrá recuperarse.",
                        {
                            title: "Confirmación final",
                            confirmLabel: "Eliminar definitivamente",
                            variant: "danger"
                        }
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

                    const startDate =
                        document.getElementById("taskStartDate").value || null;

                    const dueTime =
                        document.getElementById("taskDueTime").value || null;

                    const isProject =
                        document.getElementById(
                            "taskIsProject"
                        )?.checked ??
                        Boolean(selectedTask.isProject);

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
                            startDate,
                            dueDate,
                            dueTime,
                            isProject,
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
                    async () => {

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

                        const detachTask = targetId === "__ROOT__";

                        if (!await Dialog.confirmAsync(
                            detachTask
                                ? "¿Convertir esta subtarea en una tarea principal?"
                                : "¿Mover esta tarea y todo su árbol al proyecto seleccionado?",
                            {
                                title: detachTask
                                    ? "Convertir en tarea principal"
                                    : "Mover tarea",
                                confirmLabel: detachTask
                                    ? "Convertir"
                                    : "Mover"
                            }
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

        const settingsEntityViews = {
            areas: View.AREAS,
            contexts: View.CONTEXTS,
            tags: View.TAGS
        };

        const entityView =
            settingsEntityViews[settingsSection] ??
            view;

        if (
            entityView === View.AREAS ||
            entityView === View.CONTEXTS ||
            entityView === View.TAGS
        ) {

            const config = {

                [View.AREAS]: {
                    entities: areas,
                    name: "área",
                    prompt: "Nombre del área:",
                    create: this.callbacks.onCreateArea,
                    update: this.callbacks.onUpdateArea,
                    remove: this.callbacks.onDeleteArea,
                    isInUse: this.callbacks.onIsAreaInUse,
                    move: this.callbacks.onMoveArea
                },

                [View.CONTEXTS]: {
                    entities: contexts,
                    name: "contexto",
                    prompt: "Nombre del contexto:",
                    create: this.callbacks.onCreateContext,
                    update: this.callbacks.onUpdateContext,
                    remove: this.callbacks.onDeleteContext,
                    isInUse:
                        this.callbacks.onIsContextInUse
                },

                [View.TAGS]: {
                    entities: tags,
                    name: "etiqueta",
                    prompt: "Nombre de la etiqueta:",
                    create: this.callbacks.onCreateTag,
                    update: this.callbacks.onUpdateTag,
                    remove: this.callbacks.onDeleteTag,
                    isInUse: this.callbacks.onIsTagInUse,
                    getUsageCount:
                        this.callbacks
                            .onGetTagUsageCount,
                    getActiveUsageCount:
                        this.callbacks
                            .onGetActiveTagUsageCount,
                    reviewUsage:
                        this.callbacks
                            .onReviewTagTasks,
                    allowUsageCleanup: true
                }

            }[entityView];

            ColorSelector.bind(
                document.querySelector(
                    ".entityManager"
                ) ?? document
            );

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

                button.addEventListener("click", async () => {

                    const article = config.name === "contexto"
                        ? "este"
                        : "esta";

                    const entityId =
                        button.dataset.id;
                    const isInUse = config.isInUse(
                        entityId
                    );

                    if (
                        isInUse &&
                        !config.allowUsageCleanup
                    ) {
                        await Dialog.alert(
                            `No se puede eliminar ${article} ${config.name} porque está asignado a una o más tareas.`,
                            {
                                title:
                                    `${config.name[0].toUpperCase()}${config.name.slice(1)} en uso`
                            }
                        );
                        return;
                    }

                    if (isInUse) {
                        const usageCount =
                            config.getUsageCount?.(
                                entityId
                            ) ?? 0;
                        const activeUsageCount =
                            config
                                .getActiveUsageCount?.(
                                    entityId
                                ) ?? 0;
                        const choices = [
                            ...(activeUsageCount > 0
                                ? [{
                                    value: "review",
                                    label:
                                        `Ver ${activeUsageCount} ${activeUsageCount === 1 ? "tarea activa" : "tareas activas"}`,
                                    variant:
                                        "primary"
                                }]
                                : []),
                            {
                                value: "delete",
                                label:
                                    "Eliminar y desafectar",
                                variant:
                                    "danger"
                            }
                        ];
                        const choice =
                            await Dialog.chooseAsync(
                                `Esta etiqueta está asociada a ${usageCount} ${usageCount === 1 ? "tarea" : "tareas"}. ${activeUsageCount > 0 ? "Podés revisar las tareas activas antes de decidir." : "No hay tareas activas para revisar."} Si la eliminás, se quitará también de las tareas completadas, archivadas o enviadas a Papelera.`,
                                {
                                    title:
                                        "Etiqueta en uso",
                                    choices
                                }
                            );

                        if (choice === "review") {
                            config.reviewUsage?.(
                                entityId
                            );
                            return;
                        }

                        if (choice !== "delete") {
                            return;
                        }
                    }

                    if (!await Dialog.confirmAsync(
                        isInUse
                            ? `Se quitará esta etiqueta de todas las tareas asociadas y luego se eliminará. ¿Querés continuar?`
                            : `Eliminar ${article} ${config.name} puede afectar a múltiples tareas que lo utilizan. ¿Querés continuar?`,
                        {
                            title: `Eliminar ${config.name}`,
                            confirmLabel: "Continuar",
                            variant: "danger"
                        }
                    )) {
                        return;
                    }

                    if (!await Dialog.confirmAsync(
                        `Esta acción es definitiva y no puede deshacerse. ¿Confirmás la eliminación de ${article} ${config.name}?`,
                        {
                            title: "Confirmación definitiva",
                            confirmLabel:
                                "Eliminar definitivamente",
                            variant: "danger"
                        }
                    )) {
                        return;
                    }

                    try {

                        config.remove(entityId);

                    } catch (error) {

                        Dialog.alert(error.message);

                    }

                });

            });

            document.querySelectorAll(
                ".moveEntity"
            ).forEach(button => {

                button.addEventListener("click", () => {

                    if (!config.move) return;

                    try {
                        config.move(
                            button.dataset.id,
                            button.dataset.direction
                        );
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
