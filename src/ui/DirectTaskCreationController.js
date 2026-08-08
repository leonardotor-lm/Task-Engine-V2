import { Task } from "../domain/Task.js";
import { TaskStatus } from "../domain/TaskStatus.js";
import { Dialog } from "../components/Dialog.js";
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

export function isSubtaskCreationDraft(task) {

    return Boolean(
        isTaskCreationDraft(task) &&
        task?.taskCreationKind === "subtask"
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

            if (!await this.confirmDiscardCurrentTask()) {
                return;
            }

            this.openCreationDraft();

        };

        callbacks.onOpenProjectTaskCreation = async () => {

            if (!this.app.projectTaskId) {
                return;
            }

            if (!await this.confirmDiscardCurrentTask()) {
                return;
            }

            try {
                this.openSubtaskCreationDraft(
                    this.app.projectTaskId
                );
            } catch (error) {
                return Dialog.alert(error.message);
            }

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

            return this.discardDraft();

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

    async confirmDiscardCurrentTask() {

        const currentTask =
            this.app.selectedTask;

        return !currentTask ||
            this.app.mainView
                .confirmDiscardTaskChanges(
                    currentTask
                );

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
                        this.app.currentAreaId,
                    goalId:
                        this.app.selectedGoal?.id ?? null
                }
            );
        const draft = new Task({
            title: "Nueva tarea",
            ...defaults
        });

        this.prepareDraft(draft, "task");

        this.app.currentView = creationView;
        this.openDraft(draft);

    }

    openSubtaskCreationDraft(parentId) {

        const parent = this.app.taskService
            .getTaskById(parentId);

        this.assertValidSubtaskParent(parent);

        const draft = new Task({
            title: "Nueva subtarea",
            parentTaskId: parent.id,
            areaId: parent.areaId,
            status: parent.status
        });

        this.prepareDraft(draft, "subtask");
        this.openDraft(draft);

    }

    prepareDraft(draft, kind) {

        draft.title = "";
        draft.isTaskCreationDraft = true;
        draft.taskCreationKind = kind;
        draft.attachmentUploadInProgress = false;

    }

    openDraft(draft) {

        this.draftTaskId = draft.id;
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

        if (draft?.attachmentUploadInProgress) {
            throw new Error(
                "Esperá a que termine la carga de los adjuntos."
            );
        }

        const waitingControl =
            this.document?.getElementById(
                "taskIsWaiting"
            );
        const creationData = {
            ...data,
            attachments: [
                ...(draft?.attachments ?? [])
            ],
            isWaiting: waitingControl
                ? waitingControl.checked
                : Boolean(draft?.isWaiting)
        };
        const task = isSubtaskCreationDraft(draft)
            ? this.createSubtask(
                draft,
                creationData
            )
            : this.app.taskService
                .createTask(creationData);

        if (isSubtaskCreationDraft(draft)) {
            this.app.expandedTaskIds?.add?.(
                draft.parentTaskId
            );
            this.app.projectTaskCreationOpen = false;
        } else {
            this.app.currentView =
                getPostCreationView(
                    this.app.currentView,
                    task
                );
        }

        this.app.taskCreationOpen = false;
        this.app.selectedTask = null;
        this.draftTaskId = null;
        this.app.render();

        return task;

    }

    createSubtask(draft, data) {

        const parent = this.app.taskService
            .getTaskById(draft.parentTaskId);

        this.assertValidSubtaskParent(parent);

        if (data.recurrence) {
            throw new Error(
                "La recurrencia sólo puede aplicarse a tareas sin subtareas."
            );
        }

        const areaId =
            data.areaId ?? null;
        const status =
            parent.status === TaskStatus.INBOX &&
            areaId !== null
                ? TaskStatus.PENDING
                : parent.status;

        return this.app.taskService.createTask({
            ...data,
            parentTaskId: parent.id,
            areaId,
            status,
            recurrence: null,
            recurrenceInterval: 1,
            recurrenceWeekdays: []
        });

    }

    assertValidSubtaskParent(parent) {

        if (!parent) {
            throw new Error(
                "La tarea principal no existe."
            );
        }

        if (!this.app.taskService.isActiveTask(parent)) {
            throw new Error(
                "No se pueden agregar subtareas a esta tarea."
            );
        }

        if (parent.recurrence) {
            throw new Error(
                "No se pueden agregar subtareas a una tarea recurrente."
            );
        }

    }

    discardDraft() {

        const draft = this.app.selectedTask;

        if (!this.isActiveDraft()) return;

        if (draft?.attachmentUploadInProgress) {
            return Dialog.alert(
                "Esperá a que termine la carga de los adjuntos antes de cerrar.",
                { title: "Carga en curso" }
            );
        }

        if ((draft?.attachments ?? []).length === 0) {
            this.finishDiscardDraft();
            return;
        }

        return this.discardDraftWithAttachments(
            draft
        );

    }

    async discardDraftWithAttachments(draft) {

        try {
            await this.trashDraftAttachments(draft);
        } catch (error) {
            await Dialog.alert(
                error.message,
                {
                    title:
                        "No se pudo cancelar la creación"
                }
            );
            return;
        }

        this.finishDiscardDraft();

    }

    finishDiscardDraft() {

        this.draftTaskId = null;
        this.app.taskCreationOpen = false;
        this.app.projectTaskCreationOpen = false;
        this.app.selectedTask = null;
        this.app.render();

    }

    async trashDraftAttachments(draft) {

        const attachments = [
            ...(draft?.attachments ?? [])
        ];

        if (attachments.length === 0) return;

        if (!this.app.syncConfig?.isConfigured?.()) {
            throw new Error(
                "No se pudo limpiar los adjuntos del borrador porque la sincronización no está configurada."
            );
        }

        const connection =
            this.app.syncConfig.get();

        for (const attachment of attachments) {
            await this.app.syncEngine.gateway
                .trashAttachment({
                    ...connection,
                    driveFileId:
                        attachment.driveFileId
                });
        }

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

        const draft = this.app.selectedTask;
        const subtaskDraft =
            isSubtaskCreationDraft(draft);
        const creationLabel = subtaskDraft
            ? "Nueva subtarea"
            : "Nueva tarea";
        const actionLabel = subtaskDraft
            ? "Crear subtarea"
            : "Crear tarea";

        drawer.classList.add(
            "taskCreationDrawer"
        );
        drawer.setAttribute(
            "aria-label",
            creationLabel
        );

        const heading = drawer.querySelector(
            ".taskEditorHeader h3"
        );

        if (heading) {
            heading.textContent = creationLabel;
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
            saveButton.textContent = actionLabel;
        }

        if (mobileSaveButton) {
            mobileSaveButton.setAttribute(
                "aria-label",
                actionLabel
            );
            mobileSaveButton.setAttribute(
                "title",
                actionLabel
            );
        }

        if (titleInput) {
            titleInput.placeholder = subtaskDraft
                ? "Título de la subtarea"
                : "Título de la tarea";
            titleInput.required = true;

            const validateTitle = event => {

                if (titleInput.value.trim()) {
                    titleInput.setCustomValidity("");
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();
                titleInput.setCustomValidity(
                    subtaskDraft
                        ? "Ingresá un título para crear la subtarea."
                        : "Ingresá un título para crear la tarea."
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
            ".taskMoveField",
            ".postponeControls",
            ".postponementSummary"
        ].forEach(selector => {
            drawer.querySelector(selector)?.remove();
        });

        if (subtaskDraft) {
            drawer.querySelector(
                "#taskRecurrence"
            )?.closest(
                ".editorSection"
            )?.remove();
        }

    }

}
