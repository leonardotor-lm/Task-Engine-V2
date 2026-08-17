import { Dialog } from "../components/Dialog.js";
import { escapeHtml } from "./escapeHtml.js";

export class NotionTaskNotesController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.creatingTaskId = null;
        this.errorTaskId = null;
        this.errorMessage = "";
        this.started = false;

    }

    start() {

        if (this.started) return;

        this.started = true;
        this.wrapRender();

    }

    wrapRender() {

        const mainView = this.app?.mainView;

        if (!mainView?.render) return;

        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            originalRender(state);
            this.apply(state);

        };

    }

    apply(state) {

        const task = state?.selectedTask;
        const drawer = this.document
            ?.querySelector?.(".taskDrawer");

        if (
            !task ||
            !drawer ||
            task.isTaskCreationDraft
        ) {
            return;
        }

        const section =
            this.document.createElement("details");

        section.className =
            "editorSection editorNotionSection";
        section.dataset.mobileCollapsed = "true";
        section.innerHTML = this.getSectionHtml(task);

        const subtasks = drawer.querySelector(
            ".editorSubtasksSection"
        );
        const divider = drawer.querySelector("hr");
        const firstAction = drawer.querySelector(
            ".primaryAction, .dangerAction"
        );

        if (subtasks) {
            drawer.insertBefore(section, subtasks);
        } else if (divider) {
            drawer.insertBefore(section, divider);
        } else if (firstAction) {
            drawer.insertBefore(section, firstAction);
        } else {
            drawer.appendChild(section);
        }

        this.bind(task);

    }

    getSectionHtml(task) {

        const linked = Boolean(
            task.notionPageId &&
            task.notionPageUrl
        );
        const creating =
            this.creatingTaskId === task.id;
        const error =
            this.errorTaskId === task.id
                ? this.errorMessage
                : "";

        return `
            <summary>Notas</summary>
            <div class="editorSectionBody">
                <p class="fieldHelp">
                    La nota se edita en Notion. Task Engine guarda solamente el vínculo.
                </p>

                ${error
                    ? `
                        <p class="syncErrorHint" role="alert">
                            ${escapeHtml(error)}
                        </p>
                    `
                    : ""}

                ${linked
                    ? `
                        <div class="taskEditorActions">
                            <a
                                id="openNotionTaskNote"
                                class="secondaryAction"
                                href="${escapeHtml(task.notionPageUrl)}"
                                target="_blank"
                                rel="noopener noreferrer">
                                Abrir nota
                            </a>

                            <button
                                id="unlinkNotionTaskNote"
                                type="button"
                                class="tertiaryAction">
                                Desvincular
                            </button>
                        </div>
                    `
                    : task.isDeleted()
                        ? `
                            <p class="fieldHelp">
                                No se puede crear una nota nueva para una tarea en Papelera.
                            </p>
                        `
                        : `
                            <button
                                id="createNotionTaskNote"
                                type="button"
                                class="secondaryAction"
                                ${creating ? "disabled" : ""}>
                                ${creating
                                    ? "Creando nota…"
                                    : "Crear nota"}
                            </button>
                        `}
            </div>
        `;

    }

    bind(task) {

        this.document.getElementById(
            "createNotionTaskNote"
        )?.addEventListener(
            "click",
            () => this.create(task.id)
        );

        this.document.getElementById(
            "unlinkNotionTaskNote"
        )?.addEventListener(
            "click",
            () => this.unlink(task.id)
        );

    }

    buildTaskPayload(task) {

        const area = task.areaId
            ? this.app.areaService
                .getAreaById(task.areaId)
            : null;
        const context = task.contextId
            ? this.app.contextService
                .getContextById(task.contextId)
            : null;
        const tagNames = (task.tagIds ?? [])
            .map(id =>
                this.app.tagService
                    .getTagById(id)
                    ?.name
            )
            .filter(Boolean);

        return {
            id: task.id,
            title: task.title,
            status: task.status,
            isProject: task.isProject === true,
            areaName: area?.name ?? "",
            contextNames:
                context?.name
                    ? [context.name]
                    : [],
            tagNames,
            completedAt: task.completedAt ?? null
        };

    }

    async create(taskId) {

        if (this.creatingTaskId) return;

        const task = this.app.taskService
            .getTaskById(taskId);

        if (!task || task.isDeleted()) return;

        if (
            task.notionPageId &&
            task.notionPageUrl
        ) {
            return;
        }

        if (!this.app.syncConfig.isConfigured()) {
            this.setError(
                taskId,
                "Configurá primero la conexión con Apps Script."
            );
            return;
        }

        const gateway = this.app.syncEngine?.gateway;

        if (!gateway?.createNotionTaskPage) {
            this.setError(
                taskId,
                "Esta versión de Task Engine no puede crear notas de Notion."
            );
            return;
        }

        this.creatingTaskId = taskId;
        this.clearError();
        this.app.render();

        try {

            const result =
                await gateway.createNotionTaskPage({
                    ...this.app.syncConfig.get(),
                    task: this.buildTaskPayload(task)
                });

            if (
                !result?.pageId ||
                !result?.pageUrl
            ) {
                throw new Error(
                    "Notion no devolvió el vínculo de la nota creada."
                );
            }

            const updated =
                this.app.taskService.updateTask(
                    taskId,
                    {
                        notionPageId: result.pageId,
                        notionPageUrl: result.pageUrl
                    }
                );

            this.app.selectedTask = updated;
            this.clearError();

        } catch (error) {

            this.setError(
                taskId,
                error?.message ||
                "No se pudo crear la nota en Notion.",
                false
            );

        } finally {

            this.creatingTaskId = null;
            this.app.render();

        }

    }

    async unlink(taskId) {

        const task = this.app.taskService
            .getTaskById(taskId);

        if (
            !task ||
            !task.notionPageId ||
            !task.notionPageUrl
        ) {
            return;
        }

        const confirmed = await Dialog.confirmAsync(
            "La página seguirá existiendo en Notion. Sólo se quitará el vínculo desde Task Engine.",
            {
                title: "Desvincular nota",
                confirmLabel: "Desvincular"
            }
        );

        if (!confirmed) return;

        const updated =
            this.app.taskService.updateTask(
                taskId,
                {
                    notionPageId: null,
                    notionPageUrl: null
                }
            );

        this.app.selectedTask = updated;
        this.clearError();
        this.app.render();

    }

    setError(
        taskId,
        message,
        render = true
    ) {

        this.errorTaskId = taskId;
        this.errorMessage = String(message || "");

        if (render) {
            this.app.render();
        }

    }

    clearError() {

        this.errorTaskId = null;
        this.errorMessage = "";

    }

}
