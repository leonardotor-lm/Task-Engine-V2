import { Task } from "../domain/Task.js";
import {
    getPostCreationView,
    getTaskCreationDefaults,
    getTaskCreationView
} from "../core/TaskCreationDefaults.js";

export function isTaskCreationDraft(task) {

    return Boolean(
        task?.isTaskCreationDraft
    );

}

export class DirectTaskCreationController {

    constructor(
        app,
        {
            documentRef = globalThis.document,
            windowRef = globalThis.window
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.window = windowRef;
        this.draftTaskId = null;

    }

    start() {

        this.wrapCallbacks();
        this.wrapRender();

    }

    wrapCallbacks() {

        const callbacks =
            this.app.mainView.callbacks;
        const originalUpdateTask =
            callbacks.onUpdateTask;
        const originalCloseTaskEditor =
            callbacks.onCloseTaskEditor;

        callbacks.onOpenTaskCreation = async () => {

            const currentTask =
                this.app.selectedTask;

            if (
                currentTask &&
                !await this.app.mainView
                    .confirmDiscardTaskChanges(
                        currentTask
                    )
            ) {
                return;
            }

            this.openCreationDraft();

        };

        callbacks.onUpdateTask = (id, data) => {

            if (!this.isActiveDraft(id)) {
                return originalUpdateTask(id, data);
            }

            return this.createTask(data);

        };

        callbacks.onCloseTaskEditor = () => {

            if (!this.isActiveDraft()) {
                return originalCloseTaskEditor();
            }

            this.discardDraft();

        };

    }

    wrapRender() {

        const mainView = this.app.mainView;
        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            originalRender(state);

            if (
                isTaskCreationDraft(
                    state.selectedTask
                )
            ) {
                this.prepareCreationEditor();
            }

        };

    }

    openCreationDraft() {

        const creationView =
            getTaskCreationView(
                this.app.currentView
            );
        const defaults =
            getTaskCreationDefaults(
                creationView,
                this.app.getTodayString(),
                {
                    areaId:
                        this.app.currentAreaId
                }
            );
        const draft = new Task({
            title: "Nueva tarea",
            ...defaults
        });

        draft.title = "";
        draft.isTaskCreationDraft = true;

        this.draftTaskId = draft.id;
        this.app.currentView = creationView;
        this.app.taskCreationOpen = false;
        this.app.projectTaskCreationOpen = false;
        this.app.inlineSubtaskParentId = null;
        this.app.bulkSelectionMode = false;
        this.app.selectedTaskIds?.clear?.();
        this.app.selectedTask = draft;
        this.app.render();

    }

    createTask(data) {

        const draft = this.app.selectedTask;
        const waitingControl =
            this.document?.getElementById(
                "taskIsWaiting"
            );
        const task = this.app.taskService
            .createTask({
                ...data,
                isWaiting: waitingControl
                    ? waitingControl.checked
                    : Boolean(draft?.isWaiting)
            });

        this.app.currentView =
            getPostCreationView(
                this.app.currentView,
                task
            );
        this.app.taskCreationOpen = false;
        this.app.selectedTask = null;
        this.draftTaskId = null;
        this.app.render();

        return task;

    }

    discardDraft() {

        this.draftTaskId = null;
        this.app.taskCreationOpen = false;
        this.app.selectedTask = null;
        this.app.render();

    }

    isActiveDraft(id = null) {

        const task = this.app.selectedTask;

        return (
            isTaskCreationDraft(task) &&
            (
                id === null ||
                id === undefined ||
                task.id === id
            )
        );

    }

    prepareCreationEditor() {

        const drawer = this.document?.querySelector(
            ".taskDrawer"
        );

        if (!drawer) return;

        drawer.classList.add(
            "taskCreationDrawer"
        );
        drawer.setAttribute(
            "aria-label",
            "Nueva tarea"
        );

        const heading = drawer.querySelector(
            ".taskEditorHeader h3"
        );

        if (heading) {
            heading.textContent = "Nueva tarea";
        }

        const saveButton = drawer.querySelector(
            "#saveTask"
        );
        const mobileSaveButton = drawer.querySelector(
            "#saveTaskMobile"
        );
        const titleInput = drawer.querySelector(
            "#taskTitleEdit"
        );

        if (saveButton) {
            saveButton.textContent = "Crear tarea";
        }

        if (mobileSaveButton) {
            mobileSaveButton.setAttribute(
                "aria-label",
                "Crear tarea"
            );
            mobileSaveButton.setAttribute(
                "title",
                "Crear tarea"
            );
        }

        if (titleInput) {
            titleInput.placeholder =
                "Título de la tarea";
            titleInput.required = true;

            const validateTitle = event => {

                if (titleInput.value.trim()) {
                    titleInput.setCustomValidity("");
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();
                titleInput.setCustomValidity(
                    "Ingresá un título para crear la tarea."
                );
                titleInput.reportValidity();
                titleInput.focus();

            };

            saveButton?.addEventListener(
                "click",
                validateTitle,
                { capture: true }
            );
            mobileSaveButton?.addEventListener(
                "click",
                validateTitle,
                { capture: true }
            );

            titleInput.addEventListener(
                "input",
                () =>
                    titleInput.setCustomValidity("")
            );

            this.window?.requestAnimationFrame?.(
                () => titleInput.focus()
            );
        }

        [
            "#toggleTask",
            "#archiveTask",
            "#deleteTask",
            "#skipRecurringTask",
            ".editorSubtasksSection",
            ".editorAttachmentsSection",
            ".taskMoveField",
            ".postponeControls",
            ".postponementSummary"
        ].forEach(selector => {
            drawer.querySelector(selector)?.remove();
        });

    }

}
