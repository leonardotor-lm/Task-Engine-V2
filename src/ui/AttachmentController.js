import { Dialog } from "../components/Dialog.js";
import {
    MAX_ATTACHMENTS_PER_TASK,
    MAX_ATTACHMENT_BYTES,
    MAX_ATTACHMENT_NAME_LENGTH,
    normalizeAttachment
} from "../domain/Attachment.js";
import {
    compileAttachmentSearch,
    filterTaskTreeByAttachmentSearch
} from "../core/AttachmentSearch.js";
import { View } from "../core/View.js";
import { escapeHtml } from "./escapeHtml.js";

export class AttachmentController {

    constructor(app) {
        this.app = app;
        this.searchExpression = null;
        this.deletionInProgress = false;
    }

    start() {
        this.bindSearchCallbacks();
        this.wrapRender();
    }

    wrapRender() {

        const view = this.app.mainView;
        const originalRender = view.render.bind(view);

        view.render = state => {

            const renderedState =
                this.searchExpression &&
                state.advancedSearchMode
                    ? {
                        ...state,
                        tasks: filterTaskTreeByAttachmentSearch(
                            state.tasks,
                            this.searchExpression,
                            {
                                areas: state.areas,
                                contexts: state.contexts,
                                tags: state.tags,
                                goals: state.goals,
                                today: state.today
                            }
                        )
                    }
                    : state;

            originalRender(renderedState);
            this.renderTaskIndicators();
            this.renderSection(renderedState);
            this.bindPermanentDeletion(renderedState);

        };

    }

    renderTaskIndicators() {

        const service = this.app?.taskService;
        if (!service) return;

        document.querySelectorAll(
            ".task[data-id]"
        ).forEach(row => {
            const task = service.getTaskById?.(
                row.dataset.id
            );
            const attachments = Array.isArray(
                task?.attachments
            )
                ? task.attachments
                : [];

            if (!attachments.length) return;

            const title = row.querySelector(
                ".taskTitle"
            );

            if (
                !title ||
                title.querySelector(
                    ":scope > .taskAttachmentIndicator"
                )
            ) {
                return;
            }

            const indicator = document.createElement(
                "span"
            );
            indicator.className =
                "taskAttachmentIndicator";
            indicator.setAttribute(
                "title",
                attachments.length === 1
                    ? "1 adjunto"
                    : `${attachments.length} adjuntos`
            );
            indicator.setAttribute(
                "aria-label",
                attachments.length === 1
                    ? "La tarea tiene 1 adjunto"
                    : `La tarea tiene ${attachments.length} adjuntos`
            );
            indicator.innerHTML = `
                <svg
                    class="icon taskAttachmentIcon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    aria-hidden="true"
                    focusable="false">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
            `;

            title.prepend(indicator);
        });

    }

    bindSearchCallbacks() {

        const callbacks = this.app.mainView.callbacks;
        const originalSearch = callbacks.onSearchTasks;
        const originalSimple = callbacks.onSearchSimpleTasks;
        const originalClear = callbacks.onClearSearch;
        const originalApply = callbacks.onApplyCustomFilter;
        const originalSave = callbacks.onSaveCustomFilter;

        callbacks.onSearchTasks = query => {

            const compiled = this.compile(query);

            if (!compiled.handled) {
                this.searchExpression = null;
                return originalSearch(query);
            }

            this.applySearch(query, compiled);

        };

        callbacks.onSearchSimpleTasks = query => {
            this.searchExpression = null;
            return originalSimple(query);
        };

        callbacks.onClearSearch = () => {
            this.searchExpression = null;
            return originalClear();
        };

        callbacks.onApplyCustomFilter = id => {

            const filter = this.app.customFilterService
                .getFilterById(id);

            if (!filter) return;

            const compiled = this.compile(filter.query);

            if (!compiled.handled) {
                this.searchExpression = null;
                return originalApply(id);
            }

            this.applySearch(filter.query, compiled, id);

        };

        callbacks.onSaveCustomFilter = name => {

            if (!this.searchExpression) {
                return originalSave(name);
            }

            if (
                this.app.advancedSearchError ||
                !this.app.searchQuery
            ) {
                throw new Error(
                    "La búsqueda avanzada debe ser válida antes de guardarla."
                );
            }

            const filter = this.app.customFilterService
                .createFilter({
                    name,
                    query: this.app.searchQuery
                });

            this.app.currentCustomFilterId = filter.id;
            this.app.render();
            return filter;

        };

    }

    compile(query) {

        try {
            const result = compileAttachmentSearch(query);
            return {
                handled: result.hasAttachmentCriteria,
                expression: result.expression,
                error: null
            };
        } catch (error) {
            return {
                handled:
                    /(?:hasattachments|tieneadjuntos|attachmentcontains|adjuntocontiene|attachment|adjunto)\s*:/i
                        .test(String(query)),
                expression: null,
                error
            };
        }

    }

    applySearch(query, compiled, filterId = null) {

        this.searchExpression = compiled.expression;
        this.app.searchQuery = query;
        this.app.advancedSearchMode = true;
        this.app.advancedSearchExpression = null;
        this.app.advancedSearchError =
            compiled.error?.message ?? "";
        this.app.advancedSearchDialogOpen =
            Boolean(compiled.error);
        this.app.currentCustomFilterId = filterId;
        this.app.currentView = View.ALL;
        this.app.currentAreaId = null;
        this.app.projectTaskId = null;
        this.app.projectHistory = [];
        this.app.selectedTask = null;
        this.app.bulkSelectionMode = false;
        this.app.selectedTaskIds.clear();
        this.app.render();

    }

    isTaskCreationDraft(task) {
        return Boolean(task?.isTaskCreationDraft);
    }

    renderSection(state) {

        const task = state.selectedTask;
        const drawer = document.querySelector(".taskDrawer");

        if (!task || !drawer) return;

        const attachments = Array.isArray(task.attachments)
            ? task.attachments
            : [];
        const draft = this.isTaskCreationDraft(task);
        const editable =
            !task.isCompleted() &&
            !task.isArchived() &&
            !task.isDeleted();
        const configured = this.app.syncConfig.isConfigured();
        const section = document.createElement("details");

        section.className =
            "editorSection editorAttachmentsSection";

        if (
            drawer.classList.contains(
                "desktopTaskEditorLayout"
            )
        ) {
            section.classList.add(
                "desktopTaskEditorAttachments"
            );
        }

        section.dataset.mobileCollapsed = "true";
        const mobileEditor = window.matchMedia?.(
            "(max-width: 760px)"
        ).matches ?? false;
        section.open = draft && !mobileEditor;
        section.innerHTML = `
            <summary>Adjuntos (${attachments.length})</summary>
            <div class="editorSectionBody attachmentSectionBody">
                ${attachments.length
                    ? `<ul class="attachmentList">
                        ${attachments.map(item => `
                            <li class="attachmentItem">
                                <div class="attachmentIdentity">
                                    <a href="${escapeHtml(item.url)}"
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        ${escapeHtml(item.name)}
                                    </a>
                                    <span>${this.formatBytes(item.size)}</span>
                                </div>
                                ${editable ? `
                                    <button type="button"
                                        class="removeTaskAttachment dangerAction"
                                        data-id="${escapeHtml(item.id)}">
                                        Quitar
                                    </button>` : ""}
                            </li>`).join("")}
                    </ul>`
                    : `<p class="attachmentEmptyMessage">
                        ${draft
                            ? "Podés agregar archivos antes de crear la tarea."
                            : "Esta tarea no tiene archivos adjuntos."}
                    </p>`}

                ${!configured ? `
                    <p class="attachmentConnectionNotice">
                        Configurá la sincronización para cargar o quitar archivos. Los adjuntos existentes se pueden abrir igualmente.
                    </p>` : ""}

                ${editable && configured &&
                    attachments.length < MAX_ATTACHMENTS_PER_TASK
                    ? `<label class="attachmentUploadControl"
                            for="taskAttachmentFiles">
                            Agregar archivos
                        </label>
                        <input id="taskAttachmentFiles"
                            class="attachmentFileInput"
                            type="file" multiple>
                        <p class="attachmentLimits">
                            Hasta ${MAX_ATTACHMENTS_PER_TASK} archivos de 3 MB por tarea.
                        </p>`
                    : ""}

                ${editable &&
                    attachments.length >= MAX_ATTACHMENTS_PER_TASK
                    ? `<p class="attachmentConnectionNotice">
                        Se alcanzó el límite de ${MAX_ATTACHMENTS_PER_TASK} adjuntos.
                    </p>`
                    : ""}

                <p class="attachmentOperationStatus"
                    aria-live="polite"></p>
            </div>`;

        const target = drawer.querySelector(
            ".editorSubtasksSection"
        ) ?? drawer.querySelector(".taskEditorActions");

        target ? target.before(section) : drawer.append(section);

        section.querySelector(".attachmentFileInput")
            ?.addEventListener("change", event =>
                this.upload(task, [...event.target.files], section)
            );

        section.querySelectorAll(".removeTaskAttachment")
            .forEach(button => button.addEventListener(
                "click",
                () => this.remove(task, button.dataset.id, section)
            ));

    }

    async upload(task, files, section) {

        if (!files.length) return;

        const draft = this.isTaskCreationDraft(task);

        if (
            !draft &&
            this.app.mainView.hasUnsavedTaskEdit(task)
        ) {
            await Dialog.alert(
                "Guardá los cambios de la tarea antes de adjuntar archivos.",
                { title: "Cambios sin guardar" }
            );
            return;
        }

        if (
            (task.attachments?.length ?? 0) + files.length >
            MAX_ATTACHMENTS_PER_TASK
        ) {
            await Dialog.alert(
                `La tarea admite hasta ${MAX_ATTACHMENTS_PER_TASK} adjuntos.`,
                { title: "Límite de adjuntos" }
            );
            return;
        }

        let draftChanged = false;

        if (draft) {
            this.setDraftAttachmentBusy(
                task,
                true
            );
        }

        try {

            files.forEach(file => this.validateFile(file));
            const connection = this.requireConnection();
            const status = section.querySelector(
                ".attachmentOperationStatus"
            );

            for (let index = 0; index < files.length; index += 1) {

                const file = files[index];
                status.textContent =
                    `Subiendo ${index + 1} de ${files.length}: ${file.name}`;

                const response = await this.app.syncEngine.gateway
                    .uploadAttachment({
                        ...connection,
                        name: file.name,
                        mimeType: file.type ||
                            "application/octet-stream",
                        base64Data: await this.fileToBase64(file)
                    });
                const attachment = normalizeAttachment(
                    response.attachment
                );

                if (draft) {
                    task.addAttachment(attachment);
                    draftChanged = true;
                } else {
                    this.app.taskService.addTaskAttachment(
                        task.id,
                        attachment
                    );
                }

            }

            if (draft) {
                this.refreshSection(task);
            } else {
                this.app.selectedTask = this.app.taskService
                    .getTaskById(task.id);
                this.app.render();
            }

        } catch (error) {

            if (draft && draftChanged) {
                this.refreshSection(task);
            }

            await Dialog.alert(error.message, {
                title: "No se pudo adjuntar"
            });

        } finally {

            if (draft) {
                this.setDraftAttachmentBusy(
                    task,
                    false
                );
            }

        }

    }

    async remove(task, attachmentId, section) {

        const draft = this.isTaskCreationDraft(task);

        if (
            !draft &&
            this.app.mainView.hasUnsavedTaskEdit(task)
        ) {
            await Dialog.alert(
                "Guardá los cambios de la tarea antes de quitar un adjunto.",
                { title: "Cambios sin guardar" }
            );
            return;
        }

        const attachment = (task.attachments ?? [])
            .find(item => item.id === attachmentId);

        if (!attachment) return;

        if (!await Dialog.confirmAsync(
            `¿Quitar "${attachment.name}"? El archivo se enviará a la papelera de Google Drive.`,
            {
                title: "Quitar adjunto",
                confirmLabel: "Quitar",
                variant: "danger"
            }
        )) return;

        try {
            section.querySelector(
                ".attachmentOperationStatus"
            ).textContent = `Quitando ${attachment.name}…`;

            await this.app.syncEngine.gateway.trashAttachment({
                ...this.requireConnection(),
                driveFileId: attachment.driveFileId
            });

            if (draft) {
                task.removeAttachment(
                    attachment.id
                );
                this.refreshSection(task);
            } else {
                this.app.taskService.removeTaskAttachment(
                    task.id,
                    attachment.id
                );
                this.app.selectedTask = this.app.taskService
                    .getTaskById(task.id);
                this.app.render();
            }
        } catch (error) {
            await Dialog.alert(error.message, {
                title: "No se pudo quitar"
            });
        }

    }

    refreshSection(task) {

        document.querySelector(
            ".editorAttachmentsSection"
        )?.remove();

        this.renderSection({
            selectedTask: task
        });

    }

    setDraftAttachmentBusy(
        task,
        inProgress
    ) {

        task.attachmentUploadInProgress =
            Boolean(inProgress);

        [
            "saveTask",
            "saveTaskMobile",
            "closeTaskEditor",
            "taskAttachmentFiles"
        ].forEach(id => {
            const control =
                document.getElementById(id);

            if (control) {
                control.disabled =
                    Boolean(inProgress);
            }
        });

    }

    bindPermanentDeletion(state) {

        this.capture("permanentlyDeleteTask", async () => {
            const task = state.selectedTask;
            if (!task) return;
            const tasks = this.app.taskService.getTreesByState(
                [task.id],
                item => item.isDeleted(),
                "Sólo se pueden eliminar tareas de la papelera."
            );
            if (!await this.confirmDeletion(
                "¿Eliminar definitivamente esta tarea y sus subtareas?"
            )) return;
            await this.trashAttachments(tasks);
            this.app.mainView.callbacks
                .onPermanentlyDeleteTask(task.id);
        });

        this.capture("bulkPermanentlyDeleteTasks", async () => {
            const ids = [...this.app.selectedTaskIds];
            const tasks = this.app.taskService.getTreesByState(
                ids,
                item => item.isDeleted(),
                "Sólo se pueden eliminar tareas de la papelera."
            );
            if (!await this.confirmDeletion(
                "¿Eliminar definitivamente las tareas seleccionadas y sus subtareas?"
            )) return;
            await this.trashAttachments(tasks);
            this.app.mainView.callbacks
                .onBulkPermanentlyDeleteTasks();
        });

        this.capture("emptyTrash", async () => {
            const tasks = this.app.taskService.getDeletedTasks();
            if (!await this.confirmDeletion(
                `¿Eliminar definitivamente las ${tasks.length} tareas de la papelera?`
            )) return;
            await this.trashAttachments(tasks);
            this.app.mainView.callbacks.onEmptyTrash();
        });

    }

    capture(id, action) {

        document.getElementById(id)?.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (this.deletionInProgress) return;
                this.deletionInProgress = true;
                action()
                    .catch(error => Dialog.alert(error.message, {
                        title: "No se pudo eliminar"
                    }))
                    .finally(() => {
                        this.deletionInProgress = false;
                    });
            },
            { capture: true }
        );

    }

    async confirmDeletion(message) {

        if (!await Dialog.confirmAsync(message, {
            title: "Eliminar definitivamente",
            confirmLabel: "Continuar",
            variant: "danger"
        })) return false;

        return Dialog.confirmAsync(
            "Confirmá nuevamente la eliminación definitiva. Esta acción no puede deshacerse.",
            {
                title: "Confirmación final",
                confirmLabel: "Eliminar definitivamente",
                variant: "danger"
            }
        );

    }

    async trashAttachments(tasks) {

        const files = new Map();

        tasks.forEach(task =>
            (task.attachments ?? []).forEach(item =>
                files.set(item.driveFileId, item)
            )
        );

        if (!files.size) return;

        const connection = this.requireConnection(
            "Configurá la sincronización antes de eliminar definitivamente tareas con adjuntos."
        );

        for (const item of files.values()) {
            await this.app.syncEngine.gateway.trashAttachment({
                ...connection,
                driveFileId: item.driveFileId
            });
        }

    }

    requireConnection(
        message = "Configurá la sincronización antes de administrar adjuntos."
    ) {
        if (!this.app.syncConfig.isConfigured()) {
            throw new Error(message);
        }
        return this.app.syncConfig.get();
    }

    validateFile(file) {
        if (!file.name || file.name.length > MAX_ATTACHMENT_NAME_LENGTH) {
            throw new Error(
                `El nombre del archivo debe tener entre 1 y ${MAX_ATTACHMENT_NAME_LENGTH} caracteres.`
            );
        }
        if (
            !Number.isInteger(file.size) ||
            file.size < 1 ||
            file.size > MAX_ATTACHMENT_BYTES
        ) {
            throw new Error(
                `"${file.name}" supera el límite de 3 MB o está vacío.`
            );
        }
    }

    async fileToBase64(file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const chunks = [];
        for (let index = 0; index < bytes.length; index += 0x8000) {
            chunks.push(String.fromCharCode(
                ...bytes.subarray(index, index + 0x8000)
            ));
        }
        return btoa(chunks.join(""));
    }

    formatBytes(value) {
        const bytes = Number(value) || 0;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

}
