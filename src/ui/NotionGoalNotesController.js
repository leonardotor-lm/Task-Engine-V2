import { Dialog } from "../components/Dialog.js";
import { escapeHtml } from "./escapeHtml.js";

export class NotionGoalNotesController {

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
        this.creatingGoalId = null;
        this.errorGoalId = null;
        this.errorMessage = "";
        this.syncQueues = new Map();
        this.started = false;

    }

    start() {

        if (this.started) return;

        this.started = true;
        this.wrapGoalMutations();
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

    wrapGoalMutations() {

        const service = this.app?.goalService;

        if (!service) return;

        const methods = [
            "updateGoal",
            "completeGoal",
            "reopenGoal",
            "archiveGoal",
            "restoreGoal",
            "deleteGoal",
            "restoreDeletedGoal",
            "moveGoal",
            "detachGoal"
        ];

        for (const methodName of methods) {

            const original = service[methodName];

            if (typeof original !== "function") continue;

            service[methodName] = (...args) => {

                const before =
                    this.captureLinkedGoalMetadata();
                const result = original.apply(
                    service,
                    args
                );

                this.syncChangedLinkedGoals(before);

                return result;

            };

        }

    }

    captureLinkedGoalMetadata() {

        const goals = this.app?.goalService
            ?.getAllGoals?.() ?? [];
        const metadata = new Map();

        for (const goal of goals) {
            if (
                !goal.notionPageId ||
                !goal.notionPageUrl
            ) {
                continue;
            }

            metadata.set(
                goal.id,
                this.getSyncFingerprint(goal)
            );
        }

        return metadata;

    }

    getSyncFingerprint(goal) {

        return JSON.stringify({
            title: goal.title,
            status: goal.status,
            completedAt: goal.completedAt ?? null
        });

    }

    syncChangedLinkedGoals(before) {

        const goals = this.app?.goalService
            ?.getAllGoals?.() ?? [];

        for (const goal of goals) {

            if (
                !goal.notionPageId ||
                !goal.notionPageUrl
            ) {
                continue;
            }

            const previous = before.get(goal.id);

            if (
                previous === undefined ||
                previous === this.getSyncFingerprint(goal)
            ) {
                continue;
            }

            this.enqueueSync(goal);
        }

    }

    enqueueSync(goal) {

        if (
            !this.app?.syncConfig?.isConfigured?.() ||
            !this.app?.syncEngine?.gateway
                ?.updateNotionGoalPage
        ) {
            return;
        }

        const goalId = goal.id;
        const pageId = goal.notionPageId;
        const payload = this.buildGoalPayload(goal);
        const connection = this.app.syncConfig.get();
        const previous =
            this.syncQueues.get(goalId) ??
            Promise.resolve();

        const current = previous
            .catch(() => {})
            .then(() =>
                this.app.syncEngine.gateway
                    .updateNotionGoalPage({
                        ...connection,
                        pageId,
                        goal: payload
                    })
            )
            .then(() => {
                if (this.errorGoalId === goalId) {
                    this.clearError();
                    if (
                        this.app.selectedGoal?.id ===
                        goalId
                    ) {
                        this.app.render();
                    }
                }
            })
            .catch(error => {
                this.errorGoalId = goalId;
                this.errorMessage =
                    "El objetivo se guardó, pero no se pudo actualizar su nota en Notion: " +
                    (error?.message || "Error desconocido.");

                if (
                    this.app.selectedGoal?.id ===
                    goalId
                ) {
                    this.app.render();
                }
            })
            .finally(() => {
                if (
                    this.syncQueues.get(goalId) ===
                    current
                ) {
                    this.syncQueues.delete(goalId);
                }
            });

        this.syncQueues.set(goalId, current);

    }

    apply(state) {

        const goal =
            state?.selectedGoal ??
            this.app?.selectedGoal;
        const drawer = this.document
            ?.querySelector?.(".goalDrawer");

        if (!goal || !drawer) return;

        const existing = drawer.querySelector(
            ".editorNotionGoalSection"
        );

        if (existing) existing.remove();

        const section =
            this.document.createElement("details");

        section.className =
            "editorSection editorNotionGoalSection";
        section.dataset.mobileCollapsed = "true";
        section.innerHTML = this.getSectionHtml(goal);

        const tasksSection = drawer.querySelector(
            ".goalTasksSection"
        );

        if (tasksSection) {
            drawer.insertBefore(section, tasksSection);
        } else {
            drawer.appendChild(section);
        }

        this.bind(goal);

    }

    getSectionHtml(goal) {

        const linked = Boolean(
            goal.notionPageId &&
            goal.notionPageUrl
        );
        const creating =
            this.creatingGoalId === goal.id;
        const error =
            this.errorGoalId === goal.id
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
                                id="openNotionGoalNote"
                                class="secondaryAction"
                                href="${escapeHtml(goal.notionPageUrl)}"
                                target="_blank"
                                rel="noopener noreferrer">
                                Abrir nota
                            </a>

                            <button
                                id="unlinkNotionGoalNote"
                                type="button"
                                class="tertiaryAction">
                                Desvincular
                            </button>
                        </div>
                    `
                    : goal.status === "DELETED"
                        ? `
                            <p class="fieldHelp">
                                No se puede crear una nota nueva para un objetivo en Papelera.
                            </p>
                        `
                        : `
                            <button
                                id="createNotionGoalNote"
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

    bind(goal) {

        this.document.getElementById(
            "createNotionGoalNote"
        )?.addEventListener(
            "click",
            () => this.create(goal.id)
        );

        this.document.getElementById(
            "unlinkNotionGoalNote"
        )?.addEventListener(
            "click",
            () => this.unlink(goal.id)
        );

    }

    buildGoalPayload(goal, { linked = true } = {}) {

        return {
            id: goal.id,
            title: goal.title,
            status: goal.status,
            entityType: "Objetivo",
            areaName: "",
            contextNames: [],
            tagNames: [],
            completedAt: goal.completedAt ?? null,
            linked
        };

    }

    async create(goalId) {

        if (this.creatingGoalId) return;

        const goal = this.app.goalService
            .getGoalById(goalId);

        if (!goal || goal.status === "DELETED") {
            return;
        }

        if (
            goal.notionPageId &&
            goal.notionPageUrl
        ) {
            return;
        }

        if (!this.app.syncConfig.isConfigured()) {
            this.setError(
                goalId,
                "Configurá primero la conexión con Apps Script."
            );
            return;
        }

        const gateway = this.app.syncEngine?.gateway;

        if (!gateway?.createNotionGoalPage) {
            this.setError(
                goalId,
                "Esta versión de Task Engine no puede crear notas de Notion para objetivos."
            );
            return;
        }

        this.creatingGoalId = goalId;
        this.clearError();
        this.app.render();

        try {

            const result =
                await gateway.createNotionGoalPage({
                    ...this.app.syncConfig.get(),
                    goal: this.buildGoalPayload(goal)
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
                this.app.goalService.updateGoal(
                    goalId,
                    {
                        notionPageId: result.pageId,
                        notionPageUrl: result.pageUrl
                    }
                );

            this.app.selectedGoal = updated;
            this.clearError();

            this.window?.open?.(
                result.pageUrl,
                "_blank",
                "noopener,noreferrer"
            );

        } catch (error) {

            this.setError(
                goalId,
                error?.message ||
                "No se pudo crear la nota en Notion.",
                false
            );

        } finally {

            this.creatingGoalId = null;
            this.app.render();

        }

    }

    async unlink(goalId) {

        const goal = this.app.goalService
            .getGoalById(goalId);

        if (
            !goal ||
            !goal.notionPageId ||
            !goal.notionPageUrl
        ) {
            return;
        }

        const confirmed = await Dialog.confirmAsync(
            "La página seguirá existiendo en Notion y quedará marcada como desvinculada de Task Engine.",
            {
                title: "Desvincular nota",
                confirmLabel: "Desvincular"
            }
        );

        if (!confirmed) return;

        try {

            const gateway = this.app.syncEngine?.gateway;

            if (
                !this.app.syncConfig.isConfigured() ||
                !gateway?.updateNotionGoalPage
            ) {
                throw new Error(
                    "No se puede actualizar Notion en este momento."
                );
            }

            await gateway.updateNotionGoalPage({
                ...this.app.syncConfig.get(),
                pageId: goal.notionPageId,
                goal: this.buildGoalPayload(
                    goal,
                    { linked: false }
                )
            });

            const updated =
                this.app.goalService.updateGoal(
                    goalId,
                    {
                        notionPageId: null,
                        notionPageUrl: null
                    }
                );

            this.app.selectedGoal = updated;
            this.clearError();

        } catch (error) {

            this.setError(
                goalId,
                "No se pudo desvincular la nota: " +
                    (error?.message || "Error desconocido."),
                false
            );

        } finally {
            this.app.render();
        }

    }

    setError(
        goalId,
        message,
        render = true
    ) {

        this.errorGoalId = goalId;
        this.errorMessage = String(message || "");

        if (render) {
            this.app.render();
        }

    }

    clearError() {
        this.errorGoalId = null;
        this.errorMessage = "";
    }

}
