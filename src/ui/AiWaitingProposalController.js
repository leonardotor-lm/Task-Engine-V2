import {
    buildAiTaskContext
} from "../core/AiTaskContext.js";
import { Dialog } from "../components/Dialog.js";
import { escapeHtml } from "./escapeHtml.js";

export function parseWaitingProposals(
    answer,
    tasks
) {
    const text = String(answer || "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace < firstBrace) {
        throw new Error(
            "La IA devolvió una propuesta con formato inválido. Intentá nuevamente."
        );
    }

    let parsed;
    try {
        parsed = JSON.parse(
            text.slice(firstBrace, lastBrace + 1)
        );
    } catch {
        throw new Error(
            "La IA devolvió una propuesta con formato inválido. Intentá nuevamente."
        );
    }

    const allowedTasks = new Map(
        (tasks || []).map(task => [
            String(task?.id || ""),
            task
        ])
    );
    const seen = new Set();
    const proposals = Array.isArray(parsed?.proposals)
        ? parsed.proposals
        : [];

    return proposals
        .map(item => {
            const taskId = String(
                item?.taskId || ""
            ).trim();
            const reason = String(
                item?.reason || ""
            ).trim().slice(0, 320);
            const task = allowedTasks.get(taskId);

            if (
                !task ||
                seen.has(taskId) ||
                task.status !== "PENDING" ||
                task.isWaiting
            ) {
                return null;
            }

            seen.add(taskId);

            return {
                taskId,
                currentIsWaiting: false,
                isWaiting: true,
                reason:
                    reason ||
                    "La tarea parece depender de una condición previa antes de poder ejecutarse."
            };
        })
        .filter(Boolean);
}

export class AiWaitingProposalController {

    constructor(
        app,
        { documentRef = globalThis.document } = {}
    ) {
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
            if (html.includes('id="openAiWaitingProposal"')) {
                return html;
            }

            const marker = `
                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>`;

            if (!html.includes(marker)) return html;

            const entry = `

                    <button
                        id="openAiWaitingProposal"
                        type="button"
                        class="sidebarButton"
                        aria-haspopup="dialog">
                        Proponer En espera
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
        const entry = this.document?.getElementById?.(
            "openAiWaitingProposal"
        );
        if (!entry || entry.dataset.aiWaitingBound) return;

        entry.dataset.aiWaitingBound = "true";
        entry.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (
            !this.document?.body ||
            this.document.getElementById(
                "aiWaitingProposalDialog"
            )
        ) {
            return;
        }

        const dialog = this.document.createElement("dialog");
        dialog.id = "aiWaitingProposalDialog";
        dialog.className =
            "settingsDialog aiWaitingProposalDialog";
        dialog.setAttribute(
            "aria-labelledby",
            "aiWaitingProposalTitle"
        );
        this.document.body.appendChild(dialog);
    }

    isEnabled() {
        return Boolean(
            this.app?.aiPreferences?.isEnabled?.()
        );
    }

    open() {
        this.ensureDialog();
        this.renderDialog();
        const dialog = this.document.getElementById(
            "aiWaitingProposalDialog"
        );
        if (
            dialog &&
            !dialog.open &&
            typeof dialog.showModal === "function"
        ) {
            dialog.showModal();
        }
    }

    close() {
        const dialog = this.document.getElementById(
            "aiWaitingProposalDialog"
        );
        if (
            dialog?.open &&
            typeof dialog.close === "function"
        ) {
            dialog.close();
        }
    }

    getEligibleTasks() {
        return (
            this.app.taskService?.repository?.getAll?.() || []
        ).filter(task =>
            task.status === "PENDING" &&
            !task.isWaiting
        );
    }

    buildContext() {
        const eligibleTasks = this.getEligibleTasks();
        const base = buildAiTaskContext({
            tasks: eligibleTasks,
            areas:
                this.app.areaService?.getAllAreas?.() || [],
            contexts:
                this.app.contextService?.getAllContexts?.() || [],
            tags:
                this.app.tagService?.getAllTags?.() || [],
            question:
                "Detectar tareas pendientes que deberían quedar En espera"
        });

        return {
            ...base,
            requestType: "waitingProposal",
            tasks: base.tasks.map((task, index) => ({
                ...task,
                taskId: eligibleTasks[index]?.id || "",
                currentIsWaiting: false
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
        const dialog = this.document.getElementById(
            "aiWaitingProposalDialog"
        );
        if (!dialog) return;

        dialog.innerHTML = `
            <style>
                .aiWaitingProposalDialog { width:min(760px, calc(100vw - 32px)); }
                .aiWaitingProposalList { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
                .aiWaitingProposalItem { display:grid; grid-template-columns:auto 1fr; gap:8px 10px; padding:10px 12px; border:1px solid var(--border-color, #d8d8d8); border-radius:8px; }
                .aiWaitingProposalItem input { margin-top:3px; }
                .aiWaitingProposalTitle { font-weight:600; }
                .aiWaitingProposalChange { margin-top:3px; font-size:.92rem; }
                .aiWaitingProposalReason { grid-column:2; margin:0; line-height:1.4; }
                .aiWaitingProposalActions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="aiWaitingProposalTitle">Propuesta de tareas En espera</h2>
                <button id="closeAiWaitingProposal" type="button" class="iconButton" aria-label="Cerrar propuesta" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">${this.getBodyHtml()}</div>
            <div class="settingsDialogFooter">
                <button id="cancelAiWaitingProposal" type="button" class="tertiaryAction">Cerrar</button>
            </div>`;

        this.bindDialogEvents();
    }

    getBodyHtml() {
        if (!this.isEnabled()) {
            return `<p class="settingsHint">Activá la asistencia con IA desde Configuración → IA para generar propuestas.</p>`;
        }

        const eligibleCount = this.getEligibleTasks().length;
        const selectedCount = this.getSelectedItems().length;

        return `
            <section class="settingsToolPanel">
                <p>La IA puede detectar tareas que parecen depender de una condición previa y sugerir pasarlas a <strong>En espera</strong>. No debe usar En espera como sinónimo de baja prioridad o de “hacer más adelante”.</p>
                <p class="settingsHint">Tareas pendientes activas disponibles para analizar: ${eligibleCount}.</p>
                ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}
                ${this.proposal ? this.getProposalHtml() : ""}
                <div class="aiWaitingProposalActions">
                    ${this.proposal ? `<button id="applyAiWaitingProposal" type="button" class="primaryAction" ${selectedCount ? "" : "disabled"}>Aplicar ${selectedCount} ${selectedCount === 1 ? "cambio" : "cambios"}</button>` : ""}
                    <button id="generateAiWaitingProposal" type="button" class="secondaryAction" ${this.loading || eligibleCount === 0 ? "disabled" : ""}>${this.loading ? "Analizando…" : this.proposal ? "Generar otra propuesta" : "Generar propuesta"}</button>
                    ${this.proposal ? '<button id="discardAiWaitingProposal" type="button" class="tertiaryAction">Descartar propuesta</button>' : ""}
                </div>
            </section>`;
    }

    getProposalHtml() {
        const items = Array.isArray(this.proposal?.items)
            ? this.proposal.items
            : [];

        if (!items.length) {
            return `<p class="settingsHint">La IA no detectó tareas que justifiquen pasar a En espera.</p>`;
        }

        const tasksById = new Map(
            this.getEligibleTasks().map(task => [task.id, task])
        );
        const selectedCount = this.getSelectedItems().length;
        const html = items.map((item, index) => {
            const task = tasksById.get(item.taskId);
            const checked = item.selected !== false
                ? "checked"
                : "";

            return `
                <label class="aiWaitingProposalItem">
                    <input type="checkbox" data-ai-waiting-index="${index}" ${checked}>
                    <div>
                        <div class="aiWaitingProposalTitle">${escapeHtml(task?.title || "Tarea")}</div>
                        <div class="aiWaitingProposalChange">Pendiente → <strong>En espera</strong></div>
                    </div>
                    <p class="aiWaitingProposalReason">${escapeHtml(item.reason || "Sin explicación adicional.")}</p>
                </label>`;
        }).join("");

        return `
            <div class="aiWaitingProposalList">${html}</div>
            <p class="settingsHint">${selectedCount} de ${items.length} sugerencias seleccionadas.</p>`;
    }

    getSelectedItems() {
        const items = Array.isArray(this.proposal?.items)
            ? this.proposal.items
            : [];

        return items.filter(item =>
            item?.selected !== false
        );
    }

    bindDialogEvents() {
        this.document.getElementById(
            "closeAiWaitingProposal"
        )?.addEventListener("click", () => this.close());
        this.document.getElementById(
            "cancelAiWaitingProposal"
        )?.addEventListener("click", () => this.close());
        this.document.getElementById(
            "generateAiWaitingProposal"
        )?.addEventListener("click", () => this.generate());
        this.document.getElementById(
            "applyAiWaitingProposal"
        )?.addEventListener("click", () =>
            this.confirmAndApply()
        );
        this.document.getElementById(
            "discardAiWaitingProposal"
        )?.addEventListener("click", () => {
            this.proposal = null;
            this.error = "";
            this.renderDialog();
        });
        this.document.querySelectorAll?.(
            "[data-ai-waiting-index]"
        ).forEach(input =>
            input.addEventListener("change", event => {
                const index = Number(
                    event.target.dataset.aiWaitingIndex
                );
                if (
                    !Number.isInteger(index) ||
                    !this.proposal?.items?.[index]
                ) {
                    return;
                }

                this.proposal.items[index].selected =
                    event.target.checked;
                this.renderDialog();
            })
        );
    }

    async generate() {
        if (this.loading || !this.isEnabled()) {
            return null;
        }

        if (!this.app?.syncConfig?.isConfigured?.()) {
            this.error =
                "Configurá primero la conexión con Apps Script.";
            this.renderDialog();
            return null;
        }

        const gateway = this.app.syncEngine?.gateway;
        if (!gateway?.aiQuery) {
            this.error =
                "La instalación actual de Apps Script todavía no admite consultas de IA.";
            this.renderDialog();
            return null;
        }

        const eligibleTasks = this.getEligibleTasks();
        const context = this.buildContext();

        if (!context.tasks.length) {
            this.error =
                "No hay tareas pendientes activas para analizar.";
            this.renderDialog();
            return null;
        }

        const question = [
            "Detectá cuáles de las tareas pendientes recibidas deberían quedar En espera.",
            "En Task Engine, En espera significa que la tarea no es accionable ahora porque depende de una condición previa, una persona o evento externo, disponibilidad de tiempo o dinero, un recurso u otra circunstancia que debe cumplirse antes.",
            "No sugieras En espera sólo porque una tarea tenga baja prioridad, no tenga fecha, sea antigua o pueda postergarse.",
            "Sé conservador: si no hay indicios razonables de una condición bloqueante, omití la tarea.",
            "Devolvé exclusivamente JSON válido, sin Markdown ni texto adicional, con esta forma exacta:",
            '{"proposals":[{"taskId":"id exacto recibido","reason":"motivo breve en español"}]}',
            "Cada taskId debe copiar exactamente un taskId recibido. No inventes IDs."
        ].join("\n");

        this.loading = true;
        this.error = "";
        this.renderDialog();

        try {
            const response = await gateway.aiQuery({
                ...this.app.syncConfig.get(),
                question,
                context
            });
            const parsed = parseWaitingProposals(
                response.answer,
                eligibleTasks
            );

            this.proposal = {
                provider: response.provider || "",
                model: response.model || "",
                items: parsed.map(item => ({
                    ...item,
                    selected: true
                }))
            };

            return response;
        } catch (error) {
            this.error = String(
                error?.message ||
                error ||
                "No se pudo generar la propuesta."
            );
            return null;
        } finally {
            this.loading = false;
            this.renderDialog();
        }
    }

    validateSelectedItems() {
        const selected = this.getSelectedItems();

        if (!selected.length) {
            throw new Error(
                "Seleccioná al menos una sugerencia para aplicar."
            );
        }

        const seen = new Set();
        const validated = [];

        for (const item of selected) {
            const taskId = String(item?.taskId || "").trim();

            if (!taskId || seen.has(taskId)) {
                throw new Error(
                    "La propuesta contiene una referencia de tarea inválida o duplicada."
                );
            }

            const task = this.app?.taskService
                ?.getTaskById?.(taskId);

            if (!task || task.status !== "PENDING") {
                throw new Error(
                    "Una de las tareas propuestas ya no está pendiente. Generá una propuesta nueva antes de aplicar cambios."
                );
            }

            if (task.isWaiting) {
                throw new Error(
                    `“${task.title}” ya está En espera. Generá una propuesta nueva antes de aplicar cambios.`
                );
            }

            seen.add(taskId);
            validated.push(task);
        }

        return validated;
    }

    async confirmAndApply() {
        let tasks;

        try {
            tasks = this.validateSelectedItems();
        } catch (error) {
            await Dialog.alert(error.message, {
                title: "No se puede aplicar la propuesta"
            });
            return 0;
        }

        const confirmed = await Dialog.confirmAsync(
            `Se pasarán ${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"} a En espera. Quedarán fuera de las listas habituales hasta que desactives esa opción.`,
            {
                title: "Aplicar tareas En espera",
                confirmLabel: "Aplicar cambios",
                cancelLabel: "Cancelar"
            }
        );

        if (!confirmed) return 0;

        try {
            for (const task of tasks) {
                this.app.taskService.updateTask(
                    task.id,
                    { isWaiting: true }
                );
            }

            this.proposal = null;
            this.error = "";
            this.app.render?.();
            this.renderDialog();

            await Dialog.alert(
                `Se pasaron ${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"} a En espera.`,
                { title: "Tareas actualizadas" }
            );

            return tasks.length;
        } catch (error) {
            await Dialog.alert(
                error?.message ||
                    "No se pudieron aplicar los cambios seleccionados.",
                { title: "Error al aplicar la propuesta" }
            );
            return 0;
        }
    }
}
