import {
    buildAiTaskContext
} from "../core/AiTaskContext.js";
import { Dialog } from "../components/Dialog.js";
import {
    applyAtomicTaskUpdates
} from "../core/AtomicTaskUpdates.js";
import { escapeHtml } from "./escapeHtml.js";

function isIsoDate(value) {
    const normalized = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        return false;
    }

    const parsed = new Date(`${normalized}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === normalized;
}

function formatDate(value) {
    const normalized = String(value || "");
    if (!isIsoDate(normalized)) return normalized;

    const [year, month, day] = normalized.split("-");
    return `${day}/${month}/${year}`;
}

export function parseDueDateProposals(
    answer,
    tasks,
    today
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
            const dueDate = String(
                item?.dueDate || ""
            ).trim();
            const reason = String(
                item?.reason || ""
            ).trim().slice(0, 320);
            const task = allowedTasks.get(taskId);

            if (
                !task ||
                seen.has(taskId) ||
                task.status !== "PENDING" ||
                task.dueDate ||
                !isIsoDate(dueDate) ||
                dueDate < today ||
                (
                    task.startDate &&
                    dueDate < String(task.startDate).slice(0, 10)
                )
            ) {
                return null;
            }

            seen.add(taskId);

            return {
                taskId,
                currentDueDate: null,
                dueDate,
                reason:
                    reason ||
                    "Fecha sugerida por el análisis de la IA."
            };
        })
        .filter(Boolean);
}

export class AiDueDateProposalController {

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
            if (html.includes('id="openAiDueDateProposal"')) {
                return html;
            }

            const marker = `
                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>`;

            if (!html.includes(marker)) return html;

            const entry = `

                    <button
                        id="openAiDueDateProposal"
                        type="button"
                        class="sidebarButton"
                        aria-haspopup="dialog">
                        Proponer fechas
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
            "openAiDueDateProposal"
        );
        if (!entry || entry.dataset.aiDueDateBound) return;

        entry.dataset.aiDueDateBound = "true";
        entry.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (
            !this.document?.body ||
            this.document.getElementById(
                "aiDueDateProposalDialog"
            )
        ) {
            return;
        }

        const dialog = this.document.createElement("dialog");
        dialog.id = "aiDueDateProposalDialog";
        dialog.className =
            "settingsDialog aiDueDateProposalDialog";
        dialog.setAttribute(
            "aria-labelledby",
            "aiDueDateProposalTitle"
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
            "aiDueDateProposalDialog"
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
            "aiDueDateProposalDialog"
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
            !task.dueDate
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
                "Proponer fechas de vencimiento para tareas pendientes",
            includeTaskIds: true
        });

        const eligibleById = new Map(
            eligibleTasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "dueDateProposal",
            tasks: base.tasks.map(task => {
                const source = eligibleById.get(String(task.taskId));
                return {
                    ...task,
                    currentDueDate: source?.dueDate || null,
                    currentStartDate: source?.startDate || null
                };
            }),
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
            "aiDueDateProposalDialog"
        );
        if (!dialog) return;

        dialog.innerHTML = `
            <style>
                .aiDueDateProposalDialog { width:min(760px, calc(100vw - 32px)); }
                .aiDueDateProposalList { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
                .aiDueDateProposalItem { display:grid; grid-template-columns:auto 1fr; gap:8px 10px; padding:10px 12px; border:1px solid var(--border-color, #d8d8d8); border-radius:8px; }
                .aiDueDateProposalItem input { margin-top:3px; }
                .aiDueDateProposalTitle { font-weight:600; }
                .aiDueDateProposalChange { margin-top:3px; font-size:.92rem; }
                .aiDueDateProposalReason { grid-column:2; margin:0; line-height:1.4; }
                .aiDueDateProposalActions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="aiDueDateProposalTitle">Propuesta de fechas</h2>
                <button id="closeAiDueDateProposal" type="button" class="iconButton" aria-label="Cerrar propuesta" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">${this.getBodyHtml()}</div>
            <div class="settingsDialogFooter">
                <button id="cancelAiDueDateProposal" type="button" class="tertiaryAction">Cerrar</button>
            </div>`;

        this.bindDialogEvents();
    }

    getBodyHtml() {
        if (!this.isEnabled()) {
            return `<p class="settingsHint">Activá la asistencia con IA desde Configuración → IA para generar propuestas.</p>`;
        }

        const eligibleCount = this.getEligibleTasks().length;

        return `
            <section class="settingsToolPanel">
                <p>La IA puede sugerir fechas de vencimiento para tareas pendientes que todavía no tienen una. Gemini propone; Task Engine sólo aplica los cambios que selecciones y confirmes.</p>
                <p class="settingsHint">Tareas sin vencimiento disponibles para analizar: ${eligibleCount}.</p>
                ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}
                ${this.proposal ? this.getProposalHtml() : ""}
                <div class="aiDueDateProposalActions">
                    ${this.proposal ? `<button id="applyAiDueDateProposal" type="button" class="primaryAction" ${this.getSelectedItems().length ? "" : "disabled"}>Aplicar ${this.getSelectedItems().length} ${this.getSelectedItems().length === 1 ? "cambio" : "cambios"}</button>` : ""}
                    <button id="generateAiDueDateProposal" type="button" class="secondaryAction" ${this.loading || eligibleCount === 0 ? "disabled" : ""}>${this.loading ? "Analizando…" : this.proposal ? "Generar otra propuesta" : "Generar propuesta"}</button>
                    ${this.proposal ? '<button id="discardAiDueDateProposal" type="button" class="tertiaryAction">Descartar propuesta</button>' : ""}
                </div>
            </section>`;
    }

    getProposalHtml() {
        const items = Array.isArray(this.proposal?.items)
            ? this.proposal.items
            : [];

        if (!items.length) {
            return `<p class="settingsHint">La IA no sugirió fechas para las tareas analizadas.</p>`;
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
                <label class="aiDueDateProposalItem">
                    <input type="checkbox" data-ai-due-date-index="${index}" ${checked}>
                    <div>
                        <div class="aiDueDateProposalTitle">${escapeHtml(task?.title || "Tarea")}</div>
                        <div class="aiDueDateProposalChange">Sin vencimiento → <strong>${escapeHtml(formatDate(item.dueDate))}</strong></div>
                    </div>
                    <p class="aiDueDateProposalReason">${escapeHtml(item.reason || "Sin explicación adicional.")}</p>
                </label>`;
        }).join("");

        return `
            <div class="aiDueDateProposalList">${html}</div>
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
            "closeAiDueDateProposal"
        )?.addEventListener("click", () => this.close());
        this.document.getElementById(
            "cancelAiDueDateProposal"
        )?.addEventListener("click", () => this.close());
        this.document.getElementById(
            "generateAiDueDateProposal"
        )?.addEventListener("click", () => this.generate());
        this.document.getElementById(
            "applyAiDueDateProposal"
        )?.addEventListener("click", () =>
            this.confirmAndApply()
        );
        this.document.getElementById(
            "discardAiDueDateProposal"
        )?.addEventListener("click", () => {
            this.proposal = null;
            this.error = "";
            this.renderDialog();
        });
        this.document.querySelectorAll?.(
            "[data-ai-due-date-index]"
        ).forEach(input =>
            input.addEventListener("change", event => {
                const index = Number(
                    event.target.dataset.aiDueDateIndex
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
                "No hay tareas pendientes sin vencimiento para analizar.";
            this.renderDialog();
            return null;
        }

        const question = [
            "Proponé fechas de vencimiento para las tareas pendientes recibidas que realmente se beneficiarían de tener una fecha.",
            `La fecha de referencia es ${context.today}. No propongas fechas anteriores a hoy ni anteriores a la fecha de inicio de una tarea.`,
            "No hace falta asignar fecha a todas las tareas: si no hay base suficiente para calendarizar una tarea, omitila.",
            "Devolvé exclusivamente JSON válido, sin Markdown ni texto adicional, con esta forma exacta:",
            '{"proposals":[{"taskId":"id exacto recibido","dueDate":"YYYY-MM-DD","reason":"motivo breve en español"}]}',
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
            const parsed = parseDueDateProposals(
                response.answer,
                eligibleTasks,
                context.today
            );

            this.proposal = {
                provider: response.provider || "",
                model: response.model || "",
                items: parsed.map(item => ({
                    ...item,
                    selected: true
                }))
            };

            return this.proposal;
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

        const today = new Date()
            .toISOString()
            .slice(0, 10);
        const seen = new Set();

        return selected.map(item => {
            const taskId = String(item?.taskId || "").trim();
            const dueDate = String(
                item?.dueDate || ""
            ).trim();

            if (!taskId || seen.has(taskId)) {
                throw new Error(
                    "La propuesta contiene una referencia de tarea inválida o duplicada."
                );
            }

            if (!isIsoDate(dueDate) || dueDate < today) {
                throw new Error(
                    "La propuesta contiene una fecha inválida o vencida. Generá una propuesta nueva."
                );
            }

            const task = this.app?.taskService
                ?.getTaskById?.(taskId);

            if (!task || task.status !== "PENDING") {
                throw new Error(
                    "Una de las tareas propuestas ya no está pendiente. Generá una propuesta nueva antes de aplicar cambios."
                );
            }

            if (task.dueDate) {
                throw new Error(
                    `“${task.title}” ya tiene una fecha de vencimiento. Generá una propuesta nueva antes de aplicar cambios.`
                );
            }

            if (
                task.startDate &&
                dueDate < String(task.startDate).slice(0, 10)
            ) {
                throw new Error(
                    `La fecha sugerida para “${task.title}” quedó antes de su fecha de inicio. Generá una propuesta nueva.`
                );
            }

            seen.add(taskId);
            return { task, dueDate };
        });
    }

    async confirmAndApply() {
        let changes;

        try {
            changes = this.validateSelectedItems();
        } catch (error) {
            await Dialog.alert(error.message, {
                title: "No se puede aplicar la propuesta"
            });
            return 0;
        }

        const confirmed = await Dialog.confirmAsync(
            `Se asignará una fecha de vencimiento a ${changes.length} ${changes.length === 1 ? "tarea" : "tareas"}. Gemini sólo hizo la propuesta; Task Engine aplicará los cambios seleccionados.`,
            {
                title: "Aplicar fechas sugeridas",
                confirmLabel: "Aplicar cambios",
                cancelLabel: "Cancelar"
            }
        );

        if (!confirmed) return 0;

        try {
            applyAtomicTaskUpdates(
                this.app.taskService,
                changes.map(({ task, dueDate }) => ({
                    id: task.id,
                    changes: { dueDate }
                }))
            );

            this.proposal = null;
            this.error = "";
            this.app.render?.();
            this.renderDialog();

            await Dialog.alert(
                `Se aplicaron ${changes.length} ${changes.length === 1 ? "fecha de vencimiento" : "fechas de vencimiento"}.`,
                { title: "Fechas actualizadas" }
            );

            return changes.length;
        } catch (error) {
            await Dialog.alert(
                error?.message ||
                    "No se pudieron aplicar las fechas seleccionadas.",
                { title: "Error al aplicar la propuesta" }
            );
            return 0;
        }
    }
}
