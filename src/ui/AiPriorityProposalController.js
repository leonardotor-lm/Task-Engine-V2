import {
    buildAiTaskContext
} from "../core/AiTaskContext.js";
import { escapeHtml } from "./escapeHtml.js";

const PRIORITY_LABELS = Object.freeze({
    0: "Sin prioridad",
    1: "Baja",
    2: "Media",
    3: "Alta",
    4: "Crítica"
});

export class AiPriorityProposalController {

    constructor(app, { documentRef = globalThis.document } = {}) {
        this.app = app;
        this.document = documentRef;
        this.started = false;
        this.loading = false;
        this.error = "";
        this.proposal = null;
    }

    start() {
        if (this.started) return;
        this.started = true;
        this.wrapSidebarRender();
        this.wrapAppRender();
        this.apply();
    }

    wrapSidebarRender() {
        const sidebar = this.app?.mainView?.sidebar;
        if (!sidebar?.render) return;
        const originalRender = sidebar.render.bind(sidebar);

        sidebar.render = (...args) => {
            const html = originalRender(...args);
            if (html.includes('id="openAiPriorityProposal"')) return html;

            const marker = `
                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>`;

            if (!html.includes(marker)) return html;

            const entry = `

                    <button
                        id="openAiPriorityProposal"
                        type="button"
                        class="sidebarButton"
                        aria-haspopup="dialog">
                        Proponer prioridades
                    </button>`;

            return html.replace(marker, `${marker}${entry}`);
        };
    }

    wrapAppRender() {
        if (!this.app?.render) return;
        const originalRender = this.app.render.bind(this.app);

        this.app.render = (...args) => {
            const result = originalRender(...args);
            this.apply();
            return result;
        };
    }

    apply() {
        this.bindSidebarEntry();
        this.ensureDialog();
    }

    bindSidebarEntry() {
        const entry = this.document?.getElementById?.("openAiPriorityProposal");
        if (!entry || entry.dataset.aiPriorityBound) return;
        entry.dataset.aiPriorityBound = "true";
        entry.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (!this.document?.body || this.document.getElementById("aiPriorityProposalDialog")) return;
        const dialog = this.document.createElement("dialog");
        dialog.id = "aiPriorityProposalDialog";
        dialog.className = "settingsDialog aiPriorityProposalDialog";
        dialog.setAttribute("aria-labelledby", "aiPriorityProposalTitle");
        this.document.body.appendChild(dialog);
    }

    isEnabled() {
        return Boolean(this.app?.aiPreferences?.isEnabled?.());
    }

    open() {
        this.ensureDialog();
        this.renderDialog();
        const dialog = this.document.getElementById("aiPriorityProposalDialog");
        if (dialog && !dialog.open && typeof dialog.showModal === "function") dialog.showModal();
    }

    close() {
        const dialog = this.document.getElementById("aiPriorityProposalDialog");
        if (dialog?.open && typeof dialog.close === "function") dialog.close();
    }

    getPendingTasks() {
        return (this.app.taskService?.repository?.getAll?.() || [])
            .filter(task => task.status === "PENDING");
    }

    buildContext() {
        const pendingTasks = this.getPendingTasks();
        const base = buildAiTaskContext({
            tasks: pendingTasks,
            areas: this.app.areaService?.getAllAreas?.() || [],
            contexts: this.app.contextService?.getAllContexts?.() || [],
            tags: this.app.tagService?.getAllTags?.() || [],
            question: "Proponer prioridades para tareas pendientes",
            includeTaskIds: true
        });

        const pendingById = new Map(
            pendingTasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "priorityProposal",
            tasks: base.tasks.map(task => ({
                ...task,
                currentPriority: Number(
                    pendingById.get(String(task.taskId))?.priority ?? 0
                )
            })),
            aiProvider:
                this.app?.aiPreferences?.getProvider?.() ||
                "gemini",
            aiModel:
                this.app?.aiPreferences?.getModel?.() ||
                "gemini-3.7-flash"
        };
    }

    renderDialog() {
        const dialog = this.document.getElementById("aiPriorityProposalDialog");
        if (!dialog) return;

        dialog.innerHTML = `
            <style>
                .aiPriorityProposalDialog { width:min(760px, calc(100vw - 32px)); }
                .aiPriorityProposalList { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
                .aiPriorityProposalItem { display:grid; grid-template-columns:auto 1fr; gap:8px 10px; padding:10px 12px; border:1px solid var(--border-color, #d8d8d8); border-radius:8px; }
                .aiPriorityProposalItem input { margin-top:3px; }
                .aiPriorityProposalTitle { font-weight:600; }
                .aiPriorityProposalChange { margin-top:3px; font-size:.92rem; }
                .aiPriorityProposalReason { grid-column:2; margin:0; line-height:1.4; }
                .aiPriorityProposalActions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="aiPriorityProposalTitle">Propuesta de prioridades</h2>
                <button id="closeAiPriorityProposal" type="button" class="iconButton" aria-label="Cerrar propuesta" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">${this.getBodyHtml()}</div>
            <div class="settingsDialogFooter">
                <button id="cancelAiPriorityProposal" type="button" class="tertiaryAction">Cerrar</button>
            </div>`;

        this.bindDialogEvents();
    }

    getBodyHtml() {
        if (!this.isEnabled()) {
            return `<p class="settingsHint">Activá la asistencia con IA desde Configuración → IA para generar propuestas.</p>`;
        }

        const pendingCount = this.getPendingTasks().length;
        const proposalHtml = this.proposal
            ? this.getProposalHtml()
            : "";

        return `
            <section class="settingsToolPanel">
                <p>La IA puede sugerir cambios de prioridad sobre tus tareas pendientes. La propuesta es sólo para revisión: <strong>esta etapa no modifica ninguna tarea</strong>.</p>
                <p class="settingsHint">Tareas pendientes disponibles para analizar: ${pendingCount}.</p>
                ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}
                ${proposalHtml}
                <div class="aiPriorityProposalActions">
                    <button id="generateAiPriorityProposal" type="button" class="secondaryAction" ${this.loading || pendingCount === 0 ? "disabled" : ""}>${this.loading ? "Analizando…" : this.proposal ? "Generar otra propuesta" : "Generar propuesta"}</button>
                    ${this.proposal ? '<button id="discardAiPriorityProposal" type="button" class="tertiaryAction">Descartar propuesta</button>' : ""}
                </div>
            </section>`;
    }

    getProposalHtml() {
        const proposals = Array.isArray(this.proposal?.items)
            ? this.proposal.items
            : [];

        if (!proposals.length) {
            return `<p class="settingsHint">La IA no sugirió cambios de prioridad para las tareas analizadas.</p>`;
        }

        const tasksById = new Map(
            this.getPendingTasks().map(task => [task.id, task])
        );
        const selectedCount = proposals.filter(item => item.selected !== false).length;
        const items = proposals.map((item, index) => {
            const task = tasksById.get(item.taskId);
            const current = Number(task?.priority ?? item.currentPriority ?? 0);
            const proposed = Number(item.priority);
            const checked = item.selected !== false ? "checked" : "";

            return `
                <label class="aiPriorityProposalItem">
                    <input type="checkbox" data-ai-priority-index="${index}" ${checked}>
                    <div>
                        <div class="aiPriorityProposalTitle">${escapeHtml(task?.title || item.title || "Tarea")}</div>
                        <div class="aiPriorityProposalChange">${escapeHtml(PRIORITY_LABELS[current] || "Sin prioridad")} → <strong>${escapeHtml(PRIORITY_LABELS[proposed] || "Sin prioridad")}</strong></div>
                    </div>
                    <p class="aiPriorityProposalReason">${escapeHtml(item.reason || "Sin explicación adicional.")}</p>
                </label>`;
        }).join("");

        return `
            <div class="aiPriorityProposalList">${items}</div>
            <p class="settingsHint">${selectedCount} de ${proposals.length} sugerencias seleccionadas. La selección se conserva sólo en esta revisión y todavía no se aplica.</p>`;
    }

    bindDialogEvents() {
        this.document.getElementById("closeAiPriorityProposal")?.addEventListener("click", () => this.close());
        this.document.getElementById("cancelAiPriorityProposal")?.addEventListener("click", () => this.close());
        this.document.getElementById("generateAiPriorityProposal")?.addEventListener("click", () => this.generate());
        this.document.getElementById("discardAiPriorityProposal")?.addEventListener("click", () => {
            this.proposal = null;
            this.error = "";
            this.renderDialog();
        });
        this.document.querySelectorAll?.("[data-ai-priority-index]")
            .forEach(input => input.addEventListener("change", event => {
                const index = Number(event.target.dataset.aiPriorityIndex);
                if (!Number.isInteger(index) || !this.proposal?.items?.[index]) return;
                this.proposal.items[index].selected = event.target.checked;
                this.renderDialog();
            }));
    }

    async generate() {
        if (this.loading || !this.isEnabled()) return null;

        if (!this.app?.syncConfig?.isConfigured?.()) {
            this.error = "Configurá primero la conexión con Apps Script.";
            this.renderDialog();
            return null;
        }

        const gateway = this.app.syncEngine?.gateway;
        if (!gateway?.aiQuery) {
            this.error = "La instalación actual de Apps Script todavía no admite propuestas de prioridad.";
            this.renderDialog();
            return null;
        }

        const context = this.buildContext();
        if (!context.tasks.length) {
            this.error = "No hay tareas pendientes para analizar.";
            this.renderDialog();
            return null;
        }

        this.loading = true;
        this.error = "";
        this.renderDialog();

        try {
            const response = await gateway.aiQuery({
                ...this.app.syncConfig.get(),
                question: "Proponé cambios de prioridad para mis tareas pendientes.",
                context
            });
            this.proposal = {
                provider: response.provider || "",
                model: response.model || "",
                items: (response.proposals || []).map(item => ({
                    ...item,
                    selected: true
                }))
            };
            return response;
        } catch (error) {
            this.error = String(error?.message || error || "No se pudo generar la propuesta.");
            return null;
        } finally {
            this.loading = false;
            this.renderDialog();
        }
    }
}
