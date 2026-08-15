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

        document.getElementById("app").innerHTML = `
            <div class="layout">

                <header class="mobileHeader">

                    <button
                        id="toggleMobileMenu"
                        type="button"
                        class="mobileMenuButton"
                        aria-controls="appSidebar"
                        aria-expanded="false"
                        aria-label="Abrir navegaciÃ³n">
                        ${Icon.render("menu")}
                    </button>

                    <strong>Mis tareas</strong>

                </header>

                <button
                    id="mobileMenuBackdrop"
                    type="button"
                    class="mobileMenuBackdrop"
                    aria-label="Cerrar navegaciÃ³n"
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
            "Hay cambios sin guardar. Â¿QuerÃ©s descartarlos?",
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
            `${data.areas} Ã¡reas`,
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
                    "Android puede requerir que presiones AtrÃ¡s una vez mÃ¡s despuÃ©s de confirmar. Â¿QuerÃ©s continuar?",
                    {
                        title: "Salir de la aplicaciÃ³n",
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
                    `Completaste todas las subtareas de â€œ${parent.title}â€. Â¿QuerÃ©s completar tambiÃ©n el proyecto?`,
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
                this.toggleTaskWithAssistedParentCompletion(
                    id,
                    {
                        offerParentCompletion: false
                    }
                )
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
                    "ConexiÃ³n de sincronizaciÃ³n guardada."
                );

            } catch (error) {

                Dialog.alert(error.message);

            }

        });

        document.getElementById("clearSyncConfig")?.addEventListener("click", async () => {

            if (!await Dialog.confirmAsync(
                "Â¿Quitar la conexiÃ³n? Los datos locales no se eliminarÃ¡n.",
                {
                    title: "Quitar conexiÃ³n",
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
                "Â¿Subir el estado local completo a Google Sheets?",
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
                    `Subida completada en la revisiÃ³n ${result.revision}: ${this.backupSummary(result.summary)}.`
                );

            } catch (error) {

                if (error.name === "SyncConflictError") {

                    Dialog.alert(
                        "La nube contiene cambios mÃ¡s recientes. No se sobrescribiÃ³ nada. DescargÃ¡ primero la versiÃ³n de la nube."
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
                    ? "Hay cambios locales y remotos. Conservar la versiÃ³n de la nube reemplazarÃ¡ los datos locales, pero guardarÃ¡ una copia para poder deshacerlo. Â¿Continuar?"
                    : "La descarga reemplazarÃ¡ los datos locales y guardarÃ¡ una copia para poder deshacerla. Â¿Continuar?",
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
                    `Descarga completada desde la revisiÃ³n ${result.revision}: ${this.backupSummary(result.summary)}.`
                );

            } catch (error) {

                Dialog.alert(error.message);

            }

        });

        document.getElementById("overwriteCloud")?.addEventListener("click", async () => {

            if (!await Dialog.confirmAsync(
                "Hay cambios locales y remotos. Conservar la versiÃ³n local reemplazarÃ¡ en la nube los cambios hechos en otro dispositivo. Esta decisiÃ³n no se puede deshacer desde la nube. Â¿Continuar?",
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
                    `Se conservÃ³ la versiÃ³n local en la revisiÃ³n ${result.revision}: ${this.backupSummary(result.summary)}.`
                );

            } catch (error) {

                if (error.name === "SyncConflictError") {

                    Dialog.alert(
                        "La nube volviÃ³ a cambiar durante la operaciÃ³n. No se sobrescribiÃ³ nada. RecargÃ¡ la aplicaciÃ³n e intentÃ¡ nuevamente."
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
                "La importaciÃ³n reemplazarÃ¡ los datos actuales. Se guardarÃ¡ una copia para poder deshacerla. Â¿Continuar?",
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
                    `ImportaciÃ³n completada: ${this.backupSummary(data)}.`
                );

            } catch (error) {

                Dialog.alert(error.message);

            }

        });

        document.getElementById("restoreLastImportBackup")?.addEventListener("click", async () => {

            if (!await Dialog.confirmAsync(
                "Â¿Restaurar los datos anteriores a la Ãºltima importaciÃ³n?",
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
                "ElegÃ­ un nombre para identificar esta bÃºsqueda.",
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
                                    "Se eliminarÃ¡n definitivamente este objetivo y sus subobjetivos. Las tareas se conservarÃ¡n, pero dejarÃ¡n de estar asociadas. Â¿QuerÃ©s continuar?",
                                    {
                                        title: "Eliminar objetivo",
                                        confirmLabel: "Continuar",
                                        variant: "danger"
                                    }
                                )) {
                                    return;
                                }

                                if (!await Dialog.confirmAsync(
                                    "Esta acciÃ³n no puede deshacerse. Â¿ConfirmÃ¡s la eliminaciÃ³n definitiva?",
                                    {
                                        title: "ConfirmaciÃ³n definitiva",
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

                   ;×mí¢G§²ÚîÆ­yÒˆK›X\
ÚXÚØ›ÞOˆÚXÚØ›Þ˜[YJNÂ‚ˆÛÛœÝYÛØ[YÈHÂˆ‹‹™ØÝ[Y[ˆœ]Y\žTÙ[XÝÜ[
ˆ‹˜[ÑÛØ[[œ]‚ˆ
BˆK›X\
[œ]Oˆ[œ]˜[YJNÂ‚ˆÛÛœÝÚ[™Ù\ÈHßNÂ‚ˆYˆ
š[Üš]U˜[YHOOHˆŠHÂˆÚ[™Ù\Ëœš[Üš]HBˆ[X™\Šš[Üš]U˜[YJNÂˆB‚ˆYˆ
YQ]JHÂˆÚ[™Ù\Ë™YQ]HHYQ]NÂˆÚ[™Ù\Ë™YU[YHBˆYU[YH[ÂˆB‚ˆYˆ
\™XU˜[YHOOHˆŠHÂˆÚ[™Ù\Ë˜\™XRYBˆ\™XU˜[YHOOH—×ÐÓPT—×È‚ˆÈ[ˆˆ\™XU˜[YNÂˆB‚ˆYˆ
ÛÛ^˜[YHOOHˆŠHÂˆÚ[™Ù\Ë˜ÛÛ^YBˆÛÛ^˜[YHOOH—×ÐÓPT—×È‚ˆÈ[ˆˆÛÛ^˜[YNÂˆB‚ˆYˆ
YYÒYË›[™Ýˆ
HÂˆÚ[™Ù\Ë˜YYÒYÈBˆYYÒYÎÂˆB‚ˆYˆ
YÛØ[YË›[™Ýˆ
HÂˆÚ[™Ù\Ë˜YÛØ[YÈBˆYÛØ[YÎÂˆB‚ˆYˆ
ˆØš™XÝšÙ^\ÊÚ[™Ù\ÊBˆ›[™ÝOOHˆ
HÂ‚ˆX[ÙË˜[\
ˆ‘[YðëH[Y[›ÜÈ[ˆØ[Xš[È\˜H\XØ\‹ˆ‚ˆ
NÂ‚ˆ™]\›ŽÂ‚ˆB‚ˆžHÂ‚ˆÛÛœÝÛÝ[Bˆ\Ë˜Ø[˜XÚÜÂˆ›Û[Õ\]U\ÚÜÊÂˆ‹‹˜Ú[™Ù\ÂˆJNÂ‚ˆX[ÙË˜[\
ˆØ[Xš[ÜÈ\XØYÜÈ[ˆ	ØÛÝ[H	ØÛÝ[OOHHÈ\™XHˆˆ\™X\ÈŸK˜ˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆÛÛœÝ[Ó[Ý™QX[ÙÈBˆØÝ[Y[™Ù][[Y[žRY
ˆ˜[Ó[Ý™QX[ÙÈ‚ˆ
NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ›Ü[[Ó[Ý™QX[ÙÈ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂˆ[Ó[Ý™QX[ÙÏËœÚÝÓ[Ù[

NÂˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ˜Ø[˜Ù[[Ó[Ý™QX[ÙÈ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂˆ[Ó[Ý™QX[ÙÏË˜ÛÜÙJ
NÂˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ˜[Ó[Ý™U\ÚÜÈ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆÛÛœÝ\™Ù]YHØÝ[Y[ˆ™Ù][[Y[žRY
˜[Ó[Ý™U\™Ù]ŠBˆË˜[YNÂ‚ˆYˆ
]\™Ù]Y
HÂˆX[ÙË˜[\
‘[YðëH[ˆ\Ý[›ËˆŠNÂˆ™]\›ŽÂˆB‚ˆÛÛœÝ]XÚ\ÚÜÈH\™Ù]YOOH—×Ô“ÓÕ×ÈŽÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ]XÚ\ÚÜÂˆÈ°¯ÐÛÛ™\\ˆ\È\™X\ÈÙ[XØÚ[Û˜Y\È[ˆ\™X\Èš[˜Ú\[\ÏÈ‚ˆˆ°¯Ó[Ý™\ˆ\È\™X\ÈÙ[XØÚ[Û˜Y\ÈHÝ\È0è\˜›Û\È[›ÞYXÝÈ[YÚYÏÈ‹ˆÂˆ]Nˆ“[Ý™\ˆ\™X\È‹ˆÛÛ™š\›SX™[ˆ“[Ý™\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂˆÛÛœÝÛÝ[H\Ë˜Ø[˜XÚÜÂˆ›Û[Ó[Ý™U\ÚÜÊˆ]XÚ\ÚÜÈÈ[ˆ\™Ù]Yˆ
NÂ‚ˆ[Ó[Ý™QX[ÙÏË˜ÛÜÙJ
NÂˆX[ÙË˜[\
ˆÙH[ÝšY\›Ûˆ	ØÛÝ[H	ØÛÝ[OOHHÈ\™XHˆˆ\™X\ÈŸK˜ˆ
NÂˆHØ]Ú
\œ›ÜŠHÂˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂˆB‚ˆJNÂ‚ˆÛÛœÝ[ÑYQ]HBˆØÝ[Y[™Ù][[Y[žRY
ˆ˜[ÑYQ]H‚ˆ
NÂˆÛÛœÝ[ÑYU[YHBˆØÝ[Y[™Ù][[Y[žRY
ˆ˜[ÑYU[YH‚ˆ
NÂ‚ˆ[ÑYQ]OË˜Y]™[\Ý[™\Šˆ˜Ú[™ÙH‹ˆ

HOˆÂˆÛÛœÝ\Ñ]HBˆ›ÛÛX[Š[ÑYQ]K˜[YJNÂ‚ˆ[ÑYU[YK™\ØX›YBˆZ\Ñ]NÂ‚ˆYˆ
Z\Ñ]JHÂˆ[ÑYU[YK˜[YHHˆŽÂˆBˆBˆ
NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ˜[ÐÛÛ\]U\ÚÜÈ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ°¯ÐÛÛ\]\ˆÙ\È\È\™X\ÈÙ[XØÚ[Û˜Y\ÏÈ‹ˆÂˆ]NˆÛÛ\]\ˆ\™X\È‹ˆÛÛ™š\›SX™[ˆÛÛ\]\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆÛÛœÝÛÝ[Bˆ\Ë˜Ø[˜XÚÜÂˆ›Û[ÐÛÛ\]U\ÚÜÊ
NÂ‚ˆX[ÙË˜[\
ˆÙHÛÛ\]\›Ûˆ	ØÛÝ[H	ØÛÝ[OOHHÈ\™XHˆˆ\™X\ÈŸK˜ˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ˜[Ð\˜Ú]™U\ÚÜÈ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ°¯Ð\˜Ú]˜\ˆÙ\È\È\™X\ÈÙ[XØÚ[Û˜Y\ÏÈ‹ˆÂˆ]Nˆ\˜Ú]˜\ˆ\™X\È‹ˆÛÛ™š\›SX™[ˆ\˜Ú]˜\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆÛÛœÝÛÝ[Bˆ\Ë˜Ø[˜XÚÜÂˆ›Û[Ð\˜Ú]™U\ÚÜÊ
NÂ‚ˆX[ÙË˜[\
ˆÙH\˜Ú]˜\›Ûˆ	ØÛÝ[H	ØÛÝ[OOHHÈ\™XHˆˆ\™X\ÈŸK˜ˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ˜[Ñ[]U\ÚÜÈ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ°¯Ñ[šX\ˆHH\[\˜H\È\™X\ÈÙ[XØÚ[Û˜Y\ÏÈ\ÈÝX\™X\È\ØÙ[™Y[\È[Xšpê[ˆÙ\°è[ˆ[šXY\Ëˆ‹ˆÂˆ]Nˆ‘[šX\ˆ\™X\ÈHH\[\˜H‹ˆÛÛ™š\›SX™[ˆ‘[šX\ˆ‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆÛÛœÝÛÝ[Bˆ\Ë˜Ø[˜XÚÜÂˆ›Û[Ñ[]U\ÚÜÊ
NÂ‚ˆX[ÙË˜[\
ˆÙH[šX\›Ûˆ	ØÛÝ[H	ØÛÝ[OOHHÈ\™XHˆˆ\™X\ÈŸHHH\[\˜K˜ˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ˜[Ô\›X[™[Q[]U\ÚÜÈ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ°¯Ñ[[Z[˜\ˆYš[š]]˜[Y[H\È\™X\ÈÙ[XØÚ[Û˜Y\ÈHÝ\ÈÝX\™X\ÏÈ\ÝHXØÚpìÛˆ›ÈÙHYYH\ÚXÙ\‹ˆ‹ˆÂˆ]Nˆ‘[[Z[˜\ˆ\™X\ÈYš[š]]˜[Y[H‹ˆÛÛ™š\›SX™[ˆÛÛ[X\ˆ‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜ÊˆÛÛ™š\›pèHY]˜[Y[HH[[Z[˜XÚpìÛˆYš[š]]˜Kˆ\È\™X\È›ÈÙ°è[ˆ™XÝ\\˜\œÙKˆ‹ˆÂˆ]NˆÛÛ™š\›XXÚpìÛˆš[˜[‹ˆÛÛ™š\›SX™[ˆ‘[[Z[˜\ˆYš[š]]˜[Y[H‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆÛÛœÝÛÝ[Bˆ\Ë˜Ø[˜XÚÜÂˆ›Û[Ô\›X[™[Q[]U\ÚÜÊ
NÂ‚ˆX[ÙË˜[\
ˆÙH[[Z[˜\›ÛˆYš[š]]˜[Y[H	ØÛÝ[H	ØÛÝ[OOHHÈ\™XHˆˆ\™X\ÈŸK˜ˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ™[\U˜\Ú‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆÛÛœÝÛÝ[H[\ÚÜË™š[\Šˆ\ÚÈOˆ\ÚËš\Ñ[]Y

Bˆ
K›[™ÝÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ0¯Ñ[[Z[˜\ˆYš[š]]˜[Y[H\È	ØÛÝ[H	ØÛÝ[OOHHÈ\™XHˆˆ\™X\ÈŸHHH\[\˜OÈ\ÝHXØÚpìÛˆ›ÈÙHYYH\ÚXÙ\‹˜ˆÂˆ]Nˆ•˜XÚX\ˆ\[\˜H‹ˆÛÛ™š\›SX™[ˆÛÛ[X\ˆ‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜ÊˆÛÛ™š\›pèHY]˜[Y[H]YH]Y\°ê\È˜XÚX\ˆH\[\˜Kˆ\È\™X\È›ÈÙ°è[ˆ™XÝ\\˜\œÙKˆ‹ˆÂˆ]NˆÛÛ™š\›XXÚpìÛˆš[˜[‹ˆÛÛ™š\›SX™[ˆ•˜XÚX\ˆYš[š]]˜[Y[H‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆÛÛœÝ[]YÛÝ[Bˆ\Ë˜Ø[˜XÚÜË›Û‘[\U˜\Ú

NÂ‚ˆX[ÙË˜[\
ˆÙH˜XÚpìÈH\[\˜Nˆ	Ù[]YÛÝ[H	Ù[]YÛÝ[OOHHÈ\™XH[[Z[˜YHˆˆ\™X\È[[Z[˜Y\ÈŸHYš[š]]˜[Y[K˜ˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ›Ü[”›Ú™XÝ\ÚÐÜ™X][Ûˆ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆ\Ë˜Ø[˜XÚÜÂˆ›Û“Ü[”›Ú™XÝ\ÚÐÜ™X][ÛŠ
NÂ‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ˜ÛÜÙT›Ú™XÝšY]È‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆ\Ë˜Ø[˜XÚÜË›ÛÛÜÙT›Ú™XÝ

NÂ‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ™Y]›Ú™XÝ\ÚÈ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹]™[OˆÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û‘Y]›Ú™XÝ\ÚÊˆ]™[˜Ý\œ™[\™Ù]™]\Ù]šYˆ
NÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÓ[Ü™PXÝ[ÛœÈ‚ˆ
K™›Ü‘XXÚ
Y[HOˆÂ‚ˆY[K˜Y]™[\Ý[™\Šˆ˜ÛXÚÈ‹ˆ]™[Oˆ]™[œÝÜ›ÜYØ][ÛŠ
Bˆ
NÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹˜ÛÜÙT]ZXÚÐXÝ[ÛœÈ‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Šˆ˜ÛXÚÈ‹ˆ]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆ]Û‹˜ÛÜÙ\Ý
ˆ‹œ]ZXÚÓ[Ü™PXÝ[ÛœÈ‚ˆ
K›Ü[ˆH˜[ÙNÂ‚ˆBˆ
NÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÑY]\ÚÈ‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û”Ù[XÝ\ÚÊˆ]Û‹˜ÛÜÙ\Ý
ˆ‹œ]ZXÚÓ[Ü™PXÝ[ÛœÈ‚ˆ
K™]\Ù]šYˆ
NÂ‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÑ\XØ]U\ÚÈ‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆÛÛœÝYH]Û‹˜ÛÜÙ\Ý
ˆ‹œ]ZXÚÓ[Ü™PXÝ[ÛœÈ‚ˆ
K™]\Ù]šYÂ‚ˆÛÛœÝ\ÔÝX\ÚÜÈBˆ[\ÚÜËœÛÛYJˆ\ÚÈO‚ˆ\ÚËœ\™[\ÚÒYOOHYˆ
NÂ‚ˆÛÛœÝY\ÜØYÙHH\ÔÝX\ÚÜÂˆÈ°¯Ñ\XØ\ˆ\ÝH\™XHHÙÈÝH0è\˜›ÛÛÛ[È[ˆ›ÞYXÝÈY]›ÏÈ‚ˆˆ°¯Ñ\XØ\ˆ\ÝH\™XOÈŽÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜ÊˆY\ÜØYÙKˆÂˆ]Nˆ‘\XØ\ˆ\™XH‹ˆÛÛ™š\›SX™[ˆ‘\XØ\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆÛÛœÝ\XØ]YYBˆ\Ë˜Ø[˜XÚÜÂˆ›Û‘\XØ]U\ÚÊY
NÂ‚ˆYˆ
Y\XØ]YY
H™]\›ŽÂ‚ˆ]\XØ]Y\ÚÈBˆË‹‹™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹\ÚÈ‚ˆ
WK™š[™
ˆ\ÚÈO‚ˆ\ÚË™]\Ù]šYOOBˆ\XØ]YYˆ
NÂ‚ˆYˆ
Y\XØ]Y\ÚÊHÂ‚ˆ\Ë˜Ø[˜XÚÜÂˆ›Û”™]™X[\ÚÊˆ\XØ]YYˆ
NÂ‚ˆ\XØ]Y\ÚÈBˆË‹‹™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹\ÚÈ‚ˆ
WK™š[™
ˆ\ÚÈO‚ˆ\ÚË™]\Ù]šYOOBˆ\XØ]YYˆ
NÂ‚ˆB‚ˆYˆ
\XØ]Y\ÚÊHÂ‚ˆ\XØ]Y\ÚË˜Û\ÜÓ\Ý˜Y
ˆœ™XÙ[Q\XØ]Y\ÚÈ‚ˆ
NÂ‚ˆ\XØ]Y\ÚËœØÜ›Û[ÕšY]ÊÂˆ™Z]š[ÜŽˆœÛ[ÛÝ‹ˆ›ØÚÎˆ˜Ù[\ˆ‚ˆJNÂ‚ˆB‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÔÚÚ\™XÝ\œš[™Õ\ÚÈ‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ°¯ÔØ[X\ˆ\ÝH[œÝ[˜ÚXHH]˜[ž˜\ˆHH°ìÞ[XH™XÚOÈ‹ˆÂˆ]Nˆ”Ø[X\ˆ™XÝ\œ™[˜ÚXH‹ˆÛÛ™š\›SX™[ˆ”Ø[X\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜÂˆ›Û”]ZXÚÔÚÚ\™XÝ\œš[™Õ\ÚÊˆ]Û‹˜ÛÜÙ\Ý
ˆ‹œ]ZXÚÓ[Ü™PXÝ[ÛœÈ‚ˆ
K™]\Ù]šYˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÑ[™™XÝ\œ™[˜ÙH‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ°¯Ñš[˜[^˜\ˆH™XÝ\œ™[˜ÚXOÈH\™XHÛÛœÙ\˜\°èHÝH™XÚHXÝX[\›ÈZ˜\°èHH™\]\œÙKˆ‹ˆÂˆ]Nˆ‘š[˜[^˜\ˆ™XÝ\œ™[˜ÚXH‹ˆÛÛ™š\›SX™[ˆ‘š[˜[^˜\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜÂˆ›Û”]ZXÚÑ[™™XÝ\œ™[˜ÙJˆ]Û‹˜ÛÜÙ\Ý
ˆ‹œ]ZXÚÓ[Ü™PXÝ[ÛœÈ‚ˆ
K™]\Ù]šYˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÐ\˜Ú]™U\ÚÈ‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ°¯Ð\˜Ú]˜\ˆ\ÝH\™XOÈ‹ˆÂˆ]Nˆ\˜Ú]˜\ˆ\™XH‹ˆÛÛ™š\›SX™[ˆ\˜Ú]˜\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û\˜Ú]™U\ÚÊˆ]Û‹˜ÛÜÙ\Ý
ˆ‹œ]ZXÚÓ[Ü™PXÝ[ÛœÈ‚ˆ
K™]\Ù]šYˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÑ[]U\ÚÈ‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆÛÛœÝYH]Û‹˜ÛÜÙ\Ý
ˆ‹œ]ZXÚÓ[Ü™PXÝ[ÛœÈ‚ˆ
K™]\Ù]šYÂ‚ˆÛÛœÝ\ÔÝX\ÚÜÈBˆ[\ÚÜËœÛÛYJˆ\ÚÈO‚ˆ\ÚËœ\™[\ÚÒYOOHYˆ
NÂ‚ˆÛÛœÝY\ÜØYÙHH\ÔÝX\ÚÜÂˆÈ°¯Ó[Ý™\ˆ\ÝH\™XHHÙ\ÈÝ\ÈÝX\™X\ÈHH\[\˜OÈ‚ˆˆ°¯Ó[Ý™\ˆ\ÝH\™XHHH\[\˜OÈŽÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜ÊˆY\ÜØYÙKˆÂˆ]Nˆ“[Ý™\ˆHH\[\˜H‹ˆÛÛ™š\›SX™[‚ˆ“[Ý™\ˆHH\[\˜H‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆ\Ë˜Ø[˜XÚÜË›Û‘[]U\ÚÊY
NÂ‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÔÜÝÛ™H‚ˆ
K™›Ü‘XXÚ
Y[HOˆÂ‚ˆY[K˜Y]™[\Ý[™\Šˆ˜ÛXÚÈ‹ˆ]™[Oˆ]™[œÝÜ›ÜYØ][ÛŠ
Bˆ
NÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÔÜÝÛ™T™\Ù]‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜÂˆ›Û”]ZXÚÔÜÝÛ™U\ÚÊˆ]Û‹˜ÛÜÙ\Ý
ˆ‹œ]ZXÚÔÜÝÛ™H‚ˆ
K™]\Ù]šYˆ]Û‹™]\Ù]™]Bˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹˜\T]ZXÚÔÜÝÛ™H‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆÛÛœÝY[HH]Û‹˜ÛÜÙ\Ý
ˆ‹œ]ZXÚÔÜÝÛ™H‚ˆ
NÂ‚ˆÛÛœÝ]HHY[Bˆœ]Y\žTÙ[XÝÜŠˆ‹œ]ZXÚÔÜÝÛ™Q]H‚ˆ
Bˆ˜[YNÂ‚ˆYˆ
Y]JHÂ‚ˆX[ÙË˜[\
ˆ‘[YðëH[˜H™XÚKˆ‚ˆ
NÂ‚ˆ™]\›ŽÂ‚ˆB‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜÂˆ›Û”]ZXÚÔÜÝÛ™U\ÚÊˆY[K™]\Ù]šYˆ]Bˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹œ]ZXÚÐYÝX\ÚÈ‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û“Ü[’[›[™TÝX\ÚÊˆ]Û‹™]\Ù]šYˆ
NÂ‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹š[›[™TÝX\ÚÑ›Ü›H‚ˆ
K™›Ü‘XXÚ
›Ü›HOˆÂ‚ˆ›Ü›K˜Y]™[\Ý[™\Šˆ˜ÛXÚÈ‹ˆ]™[Oˆ]™[œÝÜ›ÜYØ][ÛŠ
Bˆ
NÂ‚ˆ›Ü›K˜Y]™[\Ý[™\ŠœÝX›Z]‹]™[OˆÂ‚ˆ]™[œ™]™[Y˜][

NÂˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆÛÛœÝ[œ]H›Ü›Kœ]Y\žTÙ[XÝÜŠˆ‹š[›[™TÝX\ÚÕ]H‚ˆ
NÂ‚ˆÛÛœÝ]HH[œ]˜[YKš[J
NÂ‚ˆYˆ
]]JH™]\›ŽÂ‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜÂˆ›ÛÜ™X]R[›[™TÝX\ÚÊˆ›Ü›K™]\Ù]œ\™[Yˆ]Bˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹˜Ø[˜Ù[[›[™TÝX\ÚÈ‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆ\Ë˜Ø[˜XÚÜÂˆ›ÛØ[˜Ù[[›[™TÝX\ÚÊ
NÂ‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
‹\ÚÈŠK™›Ü‘XXÚ
][HOˆÂ‚ˆ][K˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆÛÛœÝ\ÔÝX\ÚÜÈBˆ[\ÚÜËœÛÛYJˆ\ÚÈO‚ˆ\ÚËœ\™[\ÚÒYOOBˆ][K™]\Ù]šYˆ
NÂ‚ˆYˆ
\ÔÝX\ÚÜÊHÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û“Ü[”›Ú™XÝ
ˆ][K™]\Ù]šYˆ
NÂ‚ˆÛÛœÝÛÛ[BˆØÝ[Y[œ]Y\žTÙ[XÝÜŠˆ‹˜ÛÛ[‚ˆ
NÂ‚ˆYˆ
ÛÛ[
HÂˆÛÛ[œØÜ›ÛÜHÂˆB‚ˆÚ[™ÝËœØÜ›ÛÊÂˆÜˆˆYˆˆ™Z]š[ÜŽˆ˜]]È‚ˆJNÂ‚ˆ™]\›ŽÂ‚ˆB‚ˆ\Ë˜Ø[˜XÚÜË›Û”Ù[XÝ\ÚÊˆ][K™]\Ù]šYˆ
NÂ‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
‹ÙÙÛTÝX\ÚÜÈŠK™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹]™[OˆÂ‚ˆ]™[œÝÜ›ÜYØ][ÛŠ
NÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û•ÙÙÛU\ÚÑ^[œÚ[ÛŠˆ]Û‹™]\Ù]šYˆ
NÂ‚ˆJNÂ‚ˆJNÂ‚ˆYˆ
Ù[XÝY\ÚÊHÂ‚ˆÛÛœÝ™XÝ\œ™[˜ÙTÙ[XÝBˆØÝ[Y[™Ù][[Y[žRY
ˆ\ÚÔ™XÝ\œ™[˜ÙH‚ˆ
NÂ‚ˆÛÛœÝ\]T™XÝ\œ™[˜ÙPÛÛ›ÛÈBˆ

HOˆÂ‚ˆYˆ
\™XÝ\œ™[˜ÙTÙ[XÝ
HÂˆ™]\›ŽÂˆB‚ˆÛÛœÝœ™\]Y[˜ÞHBˆ™XÝ\œ™[˜ÙTÙ[XÝ˜[YNÂ‚ˆÛÛœÝY˜[˜ÙYšY[ÈBˆØÝ[Y[™Ù][[Y[žRY
ˆœ™XÝ\œ™[˜ÙPY˜[˜ÙYšY[È‚ˆ
NÂ‚ˆÛÛœÝÙYZÙ^\ÈBˆØÝ[Y[™Ù][[Y[žRY
ˆœ™XÝ\œ™[˜ÙUÙYZÙ^\È‚ˆ
NÂ‚ˆÛÛœÝ[š]BˆØÝ[Y[™Ù][[Y[žRY
ˆœ™XÝ\œ™[˜ÙR[\˜[[š]‚ˆ
NÂ‚ˆYˆ
Y˜[˜ÙYšY[ÊHÂˆY˜[˜ÙYšY[ËšY[ˆBˆYœ™\]Y[˜ÞNÂˆB‚ˆYˆ
ÙYZÙ^\ÊHÂˆÙYZÙ^\ËšY[ˆBˆœ™\]Y[˜ÞHOOBˆ•ÑQRÓHŽÂˆB‚ˆYˆ
[š]
HÂ‚ˆÛÛœÝ[š]ÈHÂˆRSN‚ˆ™0ëXJÊH‹ˆÑQRÓN‚ˆœÙ[X[˜JÊH‹ˆSÓ•N‚ˆ›Y\Ê\ÊH‚ˆNÂ‚ˆ[š]^ÛÛ[Bˆ[š]ÖÙœ™\]Y[˜ÞWHÏÂˆ[šYYŽÂˆB‚ˆNÂ‚ˆ™XÝ\œ™[˜ÙTÙ[XÝˆË˜Y]™[\Ý[™\Šˆ˜Ú[™ÙH‹ˆ\]T™XÝ\œ™[˜ÙPÛÛ›ÛÂˆ
NÂ‚ˆ\]T™XÝ\œ™[˜ÙPÛÛ›ÛÊ
NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆœØ]™T™XÝ\œ™[˜ÙH‚ˆ
OË˜Y]™[\Ý[™\Šˆ˜ÛXÚÈ‹ˆ

HOˆÂˆØÝ[Y[™Ù][[Y[žRY
ˆœØ]™U\ÚÈ‚ˆ
OË˜ÛXÚÊ
NÂˆBˆ
NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ˜Ø[˜Ù[™XÝ\œ™[˜ÙH‚ˆ
OË˜Y]™[\Ý[™\Šˆ˜ÛXÚÈ‹ˆ

HOˆÂˆYˆ
\™XÝ\œ™[˜ÙTÙ[XÝ
HÂˆ™]\›ŽÂˆB‚ˆ™XÝ\œ™[˜ÙTÙ[XÝ˜[YHBˆÙ[XÝY\ÚËœ™XÝ\œ™[˜ÙHÏÈˆŽÂ‚ˆÛÛœÝ[\˜[BˆØÝ[Y[™Ù][[Y[žRY
ˆ\ÚÔ™XÝ\œ™[˜ÙR[\˜[‚ˆ
NÂ‚ˆYˆ
[\˜[
HÂˆ[\˜[˜[YHHÝš[™ÊˆÙ[XÝY\ÚÂˆœ™XÝ\œ™[˜ÙR[\˜[ÏÈBˆ
NÂˆB‚ˆÛÛœÝÙ[XÝYÙYZÙ^\ÈBˆ™]ÈÙ]
ˆÙ[XÝY\ÚÂˆœ™XÝ\œ™[˜ÙUÙYZÙ^\ÈÏÈ×Bˆ
NÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹\ÚÔ™XÝ\œ™[˜ÙUÙYZÙ^H‚ˆ
K™›Ü‘XXÚ
[œ]OˆÂˆ[œ]˜ÚXÚÙYBˆÙ[XÝYÙYZÙ^\Ëš\Êˆ[X™\Š[œ]˜[YJBˆ
NÂˆJNÂ‚ˆ\]T™XÝ\œ™[˜ÙPÛÛ›ÛÊ
NÂ‚ˆÛÛœÝÙXÝ[ÛˆBˆ™XÝ\œ™[˜ÙTÙ[XÝ˜ÛÜÙ\Ý
ˆ‹™Y]Ü”ÙXÝ[Ûˆ‚ˆ
NÂ‚ˆYˆ
ÙXÝ[ÛŠHÂˆÙXÝ[Û‹›Ü[ˆH˜[ÙNÂˆB‚ˆÙXÝ[ÛËœ]Y\žTÙ[XÝÜŠˆŽœØÛÜHˆÝ[[X\žH‚ˆ
OË™›ØÝ\Ê
NÂˆBˆ
NÂ‚ˆÛÛœÝ\ÚÑYQ]HBˆØÝ[Y[™Ù][[Y[žRY
ˆ\ÚÑYQ]H‚ˆ
NÂˆÛÛœÝ\ÚÑYU[YHBˆØÝ[Y[™Ù][[Y[žRY
ˆ\ÚÑYU[YH‚ˆ
NÂ‚ˆÛÛœÝ\]QYU[YPÛÛ›ÛH

HOˆÂˆYˆ
]\ÚÑYU[YJH™]\›ŽÂˆ\ÚÑYU[YK™\ØX›YBˆ]\ÚÑYQ]OË˜[YHˆ\ÚÑYQ]K™\ØX›YÂˆYˆ
]\ÚÑYQ]OË˜[YJHÂˆ\ÚÑYU[YK˜[YHHˆŽÂˆBˆNÂ‚ˆ\ÚÑYQ]OË˜Y]™[\Ý[™\Šˆ˜Ú[™ÙH‹ˆ\]QYU[YPÛÛ›Ûˆ
NÂˆ\]QYU[YPÛÛ›Û

NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
œÝX\ÚÑ›Ü›HŠOË˜Y]™[\Ý[™\ŠœÝX›Z]‹]™[OˆÂ‚ˆ]™[œ™]™[Y˜][

NÂ‚ˆÛÛœÝ]HHØÝ[Y[ˆ™Ù][[Y[žRY
œÝX\ÚÕ]HŠBˆ˜[YBˆš[J
NÂ‚ˆYˆ
]]JH™]\›ŽÂ‚ˆ\Ë˜Ø[˜XÚÜË›ÛÜ™X]TÝX\ÚÊˆÙ[XÝY\ÚËšYˆ]Bˆ
NÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
‹œÝX\ÚÓ[šÈŠK™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂˆ\Ë˜Ø[˜XÚÜË›Û”Ù[XÝ\ÚÊ]Û‹™]\Ù]šY
NÂˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ›Ü[”\™[\ÚÈ‚ˆ
OË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È]™[OˆÂ‚ˆYˆ
ˆX]ØZ]\Ë˜ÛÛ™š\›Q\ØØ\™\ÚÐÚ[™Ù\ÊˆÙ[XÝY\ÚÂˆ
Bˆ
HÂˆ™]\›ŽÂˆB‚ˆ\Ë˜Ø[˜XÚÜË›Û“Ü[”›Ú™XÝ
ˆ]™[˜Ý\œ™[\™Ù]™]\Ù]šYˆ
NÂ‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ÙÙÛU\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆ\ËÙÙÛU\ÚÕÚ]\ÜÚ\ÝY\™[ÛÛ\][ÛŠˆÙ[XÝY\ÚËšYˆ
NÂ‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
œ™[Ü[•\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û•ÙÙÛU\ÚÊÙ[XÝY\ÚËšY
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
œÜÝÛ™U\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆÛÛœÝ™]Ñ]HBˆØÝ[Y[™Ù][[Y[žRY
œÜÝÛ™Q]HŠK˜[YNÂ‚ˆYˆ
[™]Ñ]JHÂ‚ˆX[ÙË˜[\
ˆ‘[YðëH[˜HY]˜H™XÚH\˜HÜÜÛ™\ˆH\™XKˆ‚ˆ
NÂ‚ˆ™]\›ŽÂ‚ˆB‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û”ÜÝÛ™U\ÚÊˆÙ[XÝY\ÚËšYˆ™]Ñ]Bˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
œÚÚ\™XÝ\œš[™Õ\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ°¯ÔØ[X\ˆ\ÝH™^ˆH]˜[ž˜\ˆHH°ìÞ[XH™XÚOÈ‹ˆÂˆ]Nˆ”Ø[X\ˆ™XÝ\œ™[˜ÚXH‹ˆÛÛ™š\›SX™[ˆ”Ø[X\ˆ\ÝH™^ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û”ÚÚ\™XÝ\œš[™Õ\ÚÊˆÙ[XÝY\ÚËšYˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
˜\˜Ú]™U\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ°¯Ð\˜Ú]˜\ˆ\ÝH\™XOÈ‹ˆÂˆ]Nˆ\˜Ú]˜\ˆ\™XH‹ˆÛÛ™š\›SX™[ˆ\˜Ú]˜\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û\˜Ú]™U\ÚÊÙ[XÝY\ÚËšY
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
™[]U\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆÛÛœÝ\ÔÝX\ÚÜÈH[\ÚÜËœÛÛYJˆ\ÚÈOˆ\ÚËœ\™[\ÚÒYOOHÙ[XÝY\ÚËšYˆ
NÂ‚ˆÛÛœÝY\ÜØYÙHH\ÔÝX\ÚÜÂˆÈ°¯Ó[Ý™\ˆ\ÝH\™XHHÙ\ÈÝ\ÈÝX\™X\ÈHH\[\˜OÈ‚ˆˆ°¯Ó[Ý™\ˆ\ÝH\™XHHH\[\˜OÈŽÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜ÊY\ÜØYÙKÂˆ]Nˆ‘[šX\ˆHH\[\˜H‹ˆÛÛ™š\›SX™[ˆ‘[šX\ˆHH\[\˜H‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆJJHÂˆ™]\›ŽÂˆB‚ˆ\Ë˜Ø[˜XÚÜË›Û‘[]U\ÚÊÙ[XÝY\ÚËšY
NÂ‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
œ™\ÝÜ™P\˜Ú]™Y\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û”™\ÝÜ™P\˜Ú]™Y\ÚÊÙ[XÝY\ÚËšY
NÂ‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
œ™\ÝÜ™Q[]Y\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û”™\ÝÜ™Q[]Y\ÚÊÙ[XÝY\ÚËšY
NÂ‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
œ\›X[™[Q[]U\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆÛÛœÝ\ÔÝX\ÚÜÈH[\ÚÜËœÛÛYJˆ\ÚÈOˆ\ÚËœ\™[\ÚÒYOOHÙ[XÝY\ÚËšYˆ
NÂ‚ˆÛÛœÝY\ÜØYÙHH\ÔÝX\ÚÜÂˆÈ‘\ÝHXØÚpìÛˆ›ÈÙHYYH\ÚXÙ\‹ˆ0¯Ñ[[Z[˜\ˆYš[š]]˜[Y[H\ÝH\™XHHÙ\ÈÝ\ÈÝX\™X\ÏÈ‚ˆˆ‘\ÝHXØÚpìÛˆ›ÈÙHYYH\ÚXÙ\‹ˆ0¯Ñ[[Z[˜\ˆYš[š]]˜[Y[H\ÝH\™XOÈŽÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜ÊY\ÜØYÙKÂˆ]Nˆ‘[[Z[˜\ˆ\™XH‹ˆÛÛ™š\›SX™[ˆÛÛ[X\ˆ‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆJJHÂˆ™]\›ŽÂˆB‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜ÊˆÛÛ™š\›pèHY]˜[Y[HH[[Z[˜XÚpìÛˆYš[š]]˜KˆH\™XH›ÈÙ°èH™XÝ\\˜\œÙKˆ‹ˆÂˆ]NˆÛÛ™š\›XXÚpìÛˆš[˜[‹ˆÛÛ™š\›SX™[ˆ‘[[Z[˜\ˆYš[š]]˜[Y[H‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆ\Ë˜Ø[˜XÚÜË›Û”\›X[™[Q[]U\ÚÊÙ[XÝY\ÚËšY
NÂ‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
œØ]™U\ÚÈŠOË˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆÛÛœÝ]HHØÝ[Y[ˆ™Ù][[Y[žRY
\ÚÕ]QY]ŠBˆ˜[YBˆš[J
NÂ‚ˆÛÛœÝ\ØÜš\[ÛˆHØÝ[Y[ˆ™Ù][[Y[žRY
\ÚÑ\ØÜš\[Û‘Y]ŠBˆ˜[YBˆš[J
NÂ‚ˆÛÛœÝ\™XRYBˆØÝ[Y[™Ù][[Y[žRY
\ÚÐ\™XHŠK˜[YH[Â‚ˆÛÛœÝÛÛ^YBˆØÝ[Y[™Ù][[Y[žRY
\ÚÐÛÛ^ŠK˜[YH[Â‚ˆÛÛœÝš[Üš]HH[X™\ŠˆØÝ[Y[™Ù][[Y[žRY
\ÚÔš[Üš]HŠK˜[YBˆ
NÂ‚ˆÛÛœÝYQ]HBˆØÝ[Y[™Ù][[Y[žRY
\ÚÑYQ]HŠK˜[YH[Â‚ˆÛÛœÝÝ\]HBˆØÝ[Y[™Ù][[Y[žRY
\ÚÔÝ\]HŠK˜[YH[Â‚ˆÛÛœÝYU[YHBˆØÝ[Y[™Ù][[Y[žRY
\ÚÑYU[YHŠK˜[YH[Â‚ˆÛÛœÝYÒYÈH\œ˜^Bˆ™œ›ÛJØÝ[Y[œ]Y\žTÙ[XÝÜ[
‹\ÚÕYÈŠJBˆ›X\
[œ]Oˆ[œ]˜[YJNÂ‚ˆÛÛœÝÛØ[YÈH\œ˜^Bˆ™œ›ÛJØÝ[Y[œ]Y\žTÙ[XÝÜ[
‹\ÚÑÛØ[ŠJBˆ›X\
[œ]Oˆ[œ]˜[YJNÂ‚ˆÛÛœÝ™XÝ\œ™[˜ÙHBˆØÝ[Y[™Ù][[Y[žRY
ˆ\ÚÔ™XÝ\œ™[˜ÙH‚ˆ
K˜[YH[Â‚ˆÛÛœÝ™XÝ\œ™[˜ÙR[\˜[Bˆ™XÝ\œ™[˜ÙBˆÈ[X™\ŠˆØÝ[Y[™Ù][[Y[žRY
ˆ\ÚÔ™XÝ\œ™[˜ÙR[\˜[‚ˆ
K˜[YBˆ
BˆˆNÂ‚ˆÛÛœÝ™XÝ\œ™[˜ÙUÙYZÙ^\ÈBˆ™XÝ\œ™[˜ÙHOOH•ÑQRÓH‚ˆÈÂˆ‹‹™ØÝ[Y[ˆœ]Y\žTÙ[XÝÜ[
ˆ‹\ÚÔ™XÝ\œ™[˜ÙUÙYZÙ^N˜ÚXÚÙY‚ˆ
BˆK›X\
ˆ[œ]O‚ˆ[X™\Šˆ[œ]˜[YBˆ
Bˆ
Bˆˆ×NÂ‚ˆYˆ
]]JH™]\›ŽÂ‚ˆžHÂ‚ˆ\Ë˜Ø[˜XÚÜË›Û•\]U\ÚÊÙ[XÝY\ÚËšYÂ‚ˆ]Kˆ\ØÜš\[Û‹ˆ\™XRYˆÛÛ^Yˆš[Üš]KˆÝ\]KˆYQ]KˆYU[YKˆYÒYËˆÛØ[YËˆ™XÝ\œ™[˜ÙKˆ™XÝ\œ™[˜ÙR[\˜[ˆ™XÝ\œ™[˜ÙUÙYZÙ^\Â‚ˆJNÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆœØ]™U\ÚÓ[Øš[H‚ˆ
OË˜Y]™[\Ý[™\Šˆ˜ÛXÚÈ‹ˆ

HOˆÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆœØ]™U\ÚÈ‚ˆ
OË˜ÛXÚÊ
NÂ‚ˆBˆ
NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
ˆ›[Ý™U\ÚÑœ›ÛQY]Üˆ‚ˆ
OË˜Y]™[\Ý[™\Šˆ˜ÛXÚÈ‹ˆ\Þ[˜È

HOˆÂ‚ˆÛÛœÝ\™Ù]YHØÝ[Y[ˆ™Ù][[Y[žRY
ˆ\ÚÓ[Ý™U\™Ù]‚ˆ
Bˆ˜[YNÂ‚ˆYˆ
]\™Ù]Y
HÂˆX[ÙË˜[\
ˆ‘[YðëH[ˆ\Ý[›Ëˆ‚ˆ
NÂˆ™]\›ŽÂˆB‚ˆYˆ
ˆ\Õ\ÚÑY]ÜÚ[™Ù\ÊˆÙ[XÝY\ÚÂˆ
Bˆ
HÂˆX[ÙË˜[\
ˆ‘ÝX\™0èHÜÈØ[Xš[ÜÈHH\™XH[\ÈH[Ý™\›Kˆ‚ˆ
NÂˆ™]\›ŽÂˆB‚ˆÛÛœÝ]XÚ\ÚÈH\™Ù]YOOH—×Ô“ÓÕ×ÈŽÂ‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ]XÚ\ÚÂˆÈ°¯ÐÛÛ™\\ˆ\ÝHÝX\™XH[ˆ[˜H\™XHš[˜Ú\[È‚ˆˆ°¯Ó[Ý™\ˆ\ÝH\™XHHÙÈÝH0è\˜›Û[›ÞYXÝÈÙ[XØÚ[Û˜YÏÈ‹ˆÂˆ]Nˆ]XÚ\ÚÂˆÈÛÛ™\\ˆ[ˆ\™XHš[˜Ú\[‚ˆˆ“[Ý™\ˆ\™XH‹ˆÛÛ™š\›SX™[ˆ]XÚ\ÚÂˆÈÛÛ™\\ˆ‚ˆˆ“[Ý™\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆYˆ
\™Ù]YOOH—×Ô“ÓÕ×ÈŠHÂˆ\Ë˜Ø[˜XÚÜÂˆ›Û‘]XÚÝX\ÚÊˆÙ[XÝY\ÚËšYˆ
NÂˆH[ÙHÂˆ\Ë˜Ø[˜XÚÜÂˆ›Û“[Ý™U\ÚÕÔ›Ú™XÝ
ˆÙ[XÝY\ÚËšYˆ\™Ù]Yˆ
NÂˆB‚ˆHØ]Ú
\œ›ÜŠHÂˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂˆB‚ˆBˆ
NÂ‚ˆB‚ˆB‚ˆÛÛœÝÙ][™ÜÑ[]UšY]ÜÈHÂˆ\™X\ÎˆšY]ËT‘PTËˆÛÛ^ÎˆšY]ËÓÓ•VËˆYÜÎˆšY]Ë•QÔÂˆNÂ‚ˆÛÛœÝ[]UšY]ÈBˆÙ][™ÜÑ[]UšY]ÜÖÜÙ][™ÜÔÙXÝ[Û—HÏÂˆšY]ÎÂ‚ˆYˆ
ˆ[]UšY]ÈOOHšY]ËT‘PTÈˆ[]UšY]ÈOOHšY]ËÓÓ•VÈˆ[]UšY]ÈOOHšY]Ë•QÔÂˆ
HÂ‚ˆÛÛœÝÛÛ™šYÈHÂ‚ˆÕšY]ËT‘PT×NˆÂˆ[]Y\Îˆ\™X\Ëˆ˜[YNˆ°è\™XH‹ˆ›Û\ˆ“›ÛXœ™H[0è\™XNˆ‹ˆÜ™X]Nˆ\Ë˜Ø[˜XÚÜË›ÛÜ™X]P\™XKˆ\]Nˆ\Ë˜Ø[˜XÚÜË›Û•\]P\™XKˆ™[[Ý™Nˆ\Ë˜Ø[˜XÚÜË›Û‘[]P\™XKˆ\Ò[•\ÙNˆ\Ë˜Ø[˜XÚÜË›Û’\Ð\™XR[•\ÙKˆ[Ý™Nˆ\Ë˜Ø[˜XÚÜË›Û“[Ý™P\™XBˆK‚ˆÕšY]ËÓÓ•V×NˆÂˆ[]Y\ÎˆÛÛ^Ëˆ˜[YNˆ˜ÛÛ^È‹ˆ›Û\ˆ“›ÛXœ™H[ÛÛ^Îˆ‹ˆÜ™X]Nˆ\Ë˜Ø[˜XÚÜË›ÛÜ™X]PÛÛ^ˆ\]Nˆ\Ë˜Ø[˜XÚÜË›Û•\]PÛÛ^ˆ™[[Ý™Nˆ\Ë˜Ø[˜XÚÜË›Û‘[]PÛÛ^ˆ\Ò[•\ÙN‚ˆ\Ë˜Ø[˜XÚÜË›Û’\ÐÛÛ^[•\ÙBˆK‚ˆÕšY]Ë•QÔ×NˆÂˆ[]Y\ÎˆYÜËˆ˜[YNˆ™]\]Y]H‹ˆ›Û\ˆ“›ÛXœ™HHH]\]Y]Nˆ‹ˆÜ™X]Nˆ\Ë˜Ø[˜XÚÜË›ÛÜ™X]UYËˆ\]Nˆ\Ë˜Ø[˜XÚÜË›Û•\]UYËˆ™[[Ý™Nˆ\Ë˜Ø[˜XÚÜË›Û‘[]UYËˆ\Ò[•\ÙNˆ\Ë˜Ø[˜XÚÜË›Û’\ÕYÒ[•\ÙBˆB‚ˆVÙ[]UšY]×NÂ‚ˆÛÛÜ”Ù[XÝÜ‹˜š[™
ˆØÝ[Y[œ]Y\žTÙ[XÝÜŠˆ‹™[]SX[˜YÙ\ˆ‚ˆ
HÏÈØÝ[Y[ˆ
NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
™[]Q›Ü›HŠOË˜Y]™[\Ý[™\ŠœÝX›Z]‹]™[OˆÂ‚ˆ]™[œ™]™[Y˜][

NÂ‚ˆÛÛœÝ˜[YHHØÝ[Y[ˆ™Ù][[Y[žRY
™[]S˜[YHŠBˆ˜[YBˆš[J
NÂ‚ˆÛÛœÝÛÛÜˆBˆØÝ[Y[™Ù][[Y[žRY
™[]PÛÛÜˆŠK˜[YNÂ‚ˆYˆ
[˜[YJH™]\›ŽÂ‚ˆÛÛ™šYË˜Ü™X]J˜[YKÛÛÜŠNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
‹™[]Q[]HŠK™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹\Þ[˜È

HOˆÂ‚ˆÛÛœÝ\XÛHHÛÛ™šYË›˜[YHOOH˜ÛÛ^È‚ˆÈ™\ÝH‚ˆˆ™\ÝHŽÂ‚ˆYˆ
ÛÛ™šYËš\Ò[•\ÙJˆ]Û‹™]\Ù]šYˆ
JHÂˆ]ØZ]X[ÙË˜[\
ˆ›ÈÙHYYH[[Z[˜\ˆ	Ø\XÛ_H	ØÛÛ™šYË›˜[Y_HÜœ]YH\Ý0èH\ÚYÛ˜YÈH[˜HÈpè\È\™X\Ë˜ˆÂˆ]N‚ˆ	ØÛÛ™šYË›˜[YVÌKÕ\\Ø\ÙJ
_IØÛÛ™šYË›˜[YKœÛXÙJJ_H[ˆ\ÛØˆBˆ
NÂˆ™]\›ŽÂˆB‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ[[Z[˜\ˆ	Ø\XÛ_H	ØÛÛ™šYË›˜[Y_HYYHY™XÝ\ˆHpî›\\È\™X\È]YHÈ][^˜[‹ˆ0¯Ô]Y\°ê\ÈÛÛ[X\ØˆÂˆ]Nˆ[[Z[˜\ˆ	ØÛÛ™šYË›˜[Y_XˆÛÛ™š\›SX™[ˆÛÛ[X\ˆ‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆYˆ
X]ØZ]X[ÙË˜ÛÛ™š\›P\Þ[˜Êˆ\ÝHXØÚpìÛˆ\ÈYš[š]]˜HH›ÈYYH\ÚXÙ\œÙKˆ0¯ÐÛÛ™š\›pè\ÈH[[Z[˜XÚpìÛˆH	Ø\XÛ_H	ØÛÛ™šYË›˜[Y_OØˆÂˆ]NˆÛÛ™š\›XXÚpìÛˆYš[š]]˜H‹ˆÛÛ™š\›SX™[‚ˆ‘[[Z[˜\ˆYš[š]]˜[Y[H‹ˆ˜\šX[ˆ™[™Ù\ˆ‚ˆBˆ
JHÂˆ™]\›ŽÂˆB‚ˆžHÂ‚ˆÛÛ™šYËœ™[[Ý™J]Û‹™]\Ù]šY
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂ‚ˆB‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹›[Ý™Q[]H‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆYˆ
XÛÛ™šYË›[Ý™JH™]\›ŽÂ‚ˆžHÂˆÛÛ™šYË›[Ý™Jˆ]Û‹™]\Ù]šYˆ]Û‹™]\Ù]™\™XÝ[Û‚ˆ
NÂˆHØ]Ú
\œ›ÜŠHÂˆX[ÙË˜[\
\œ›Ü‹›Y\ÜØYÙJNÂˆB‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹™Y][]H‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆÛÛœÝ][HH]Û‹˜ÛÜÙ\Ý
ˆ‹™[]R][H‚ˆ
NÂ‚ˆ][Kœ]Y\žTÙ[XÝÜŠˆ‹™[]Q\Ü^H‚ˆ
KšY[ˆHYNÂ‚ˆÛÛœÝ›Ü›HH][Kœ]Y\žTÙ[XÝÜŠˆ‹™[]QY]›Ü›H‚ˆ
NÂ‚ˆ›Ü›KšY[ˆH˜[ÙNÂ‚ˆ›Ü›Kœ]Y\žTÙ[XÝÜŠˆ‹™[]QY]˜[YH‚ˆ
K™›ØÝ\Ê
NÂ‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹˜Ø[˜Ù[[]QY]‚ˆ
K™›Ü‘XXÚ
]ÛˆOˆÂ‚ˆ]Û‹˜Y]™[\Ý[™\Š˜ÛXÚÈ‹

HOˆÂ‚ˆÛÛœÝ][HH]Û‹˜ÛÜÙ\Ý
ˆ‹™[]R][H‚ˆ
NÂ‚ˆ][Kœ]Y\žTÙ[XÝÜŠˆ‹™[]QY]›Ü›H‚ˆ
KšY[ˆHYNÂ‚ˆ][Kœ]Y\žTÙ[XÝÜŠˆ‹™[]Q\Ü^H‚ˆ
KšY[ˆH˜[ÙNÂ‚ˆJNÂ‚ˆJNÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
ˆ‹™[]QY]›Ü›H‚ˆ
K™›Ü‘XXÚ
›Ü›HOˆÂ‚ˆÛÛœÝØ]™Q[]HH

HOˆÂ‚ˆÛÛœÝ[]HBˆÛÛ™šYË™[]Y\Ë™š[™
ˆ[]HO‚ˆ[]KšYOOBˆ›Ü›K™]\Ù]šYˆ
NÂ‚ˆYˆ
Y[]JH™]\›ŽÂ‚ˆÛÛœÝ˜[YHBˆ›Ü›Kœ]Y\žTÙ[XÝÜŠˆ‹™[]QY]˜[YH‚ˆ
K˜[YKš[J
NÂ‚ˆÛÛœÝÛÛÜˆBˆ›Ü›Kœ]Y\žTÙ[XÝÜŠˆ‹™[]QY]ÛÛÜˆ‚ˆ
K˜[YNÂ‚ˆYˆ
[˜[YJH™]\›ŽÂ‚ˆžHÂ‚ˆÛÛ™šYË\]Jˆ[]KšYˆ˜[YKˆÛÛÜ‚ˆ
NÂ‚ˆHØ]Ú
\œ›ÜŠHÂ‚ˆX[ÙË˜[\
ˆ\œ›Ü‹›Y\ÜØYÙBˆ
NÂ‚ˆB‚ˆNÂ‚ˆ›Ü›K˜Y]™[\Ý[™\ŠˆœÝX›Z]‹ˆ]™[OˆÂ‚ˆ]™[œ™]™[Y˜][

NÂ‚ˆBˆ
NÂ‚ˆ›Ü›Kœ]Y\žTÙ[XÝÜŠˆ‹œØ]™Q[]QY]‚ˆ
K˜Y]™[\Ý[™\Šˆ˜ÛXÚÈ‹ˆØ]™Q[]Bˆ
NÂ‚ˆ›Ü›Kœ]Y\žTÙ[XÝÜŠˆ‹™[]QY]˜[YH‚ˆ
K˜Y]™[\Ý[™\ŠˆšÙ^YÝÛˆ‹ˆ]™[OˆÂ‚ˆYˆ
ˆ]™[šÙ^HOOBˆ‘[\ˆ‚ˆ
HÂˆ™]\›ŽÂˆB‚ˆ]™[œ™]™[Y˜][

NÂˆØ]™Q[]J
NÂ‚ˆBˆ
NÂ‚ˆJNÎÂ‚ˆBˆB‚ŸB