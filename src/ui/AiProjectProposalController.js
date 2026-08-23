import {
    buildAiTaskContext
} from "../core/AiTaskContext.js";
import { Dialog } from "../components/Dialog.js";
import { escapeHtml } from "./escapeHtml.js";
import {
    assertAiStructuredResponseComplete,
    requireAiStructuredCollection
} from "../core/AiStructuredResponse.js";

const MIN_SUBTASKS = 2;
const MAX_SUBTASKS = 6;
const MAX_TITLE_LENGTH = 140;

function normalizeTitle(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_TITLE_LENGTH);
}

export function parseProjectProposals(answer, tasks) {
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
    const proposals = requireAiStructuredCollection(
        parsed,
        "proposals",
        { kind: "una propuesta" }
    );

    return proposals
        .map(item => {
            const taskId = String(item?.taskId || "").trim();
            const task = allowedTasks.get(taskId);

            if (
                !task ||
                seen.has(taskId) ||
                task.status !== "PENDING" ||
                task.isProject ||
                task.parentTaskId ||
                task.recurrence
            ) {
                return null;
            }

            const parentTitle = normalizeTitle(task.title)
                .toLocaleLowerCase("es");
            const subtaskTitles = [
                ...new Set(
                    (Array.isArray(item?.subtasks)
                        ? item.subtasks
                        : [])
                        .map(normalizeTitle)
                        .filter(Boolean)
                )
            ].filter(title =>
                title.toLocaleLowerCase("es") !== parentTitle
            );

            if (
                subtaskTitles.length < MIN_SUBTASKS ||
                subtaskTitles.length > MAX_SUBTASKS
            ) {
                return null;
            }

            seen.add(taskId);

            return {
                taskId,
                taskVersion: Number(task.version ?? 1),
                subtaskTitles,
                reason: String(item?.reason || "")
                    .trim()
                    .slice(0, 320) ||
                    "La tarea parece representar un resultado que requiere varias acciones diferenciadas."
            };
        })
        .filter(Boolean);
}

export class AiProjectProposalController {

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
            if (html.includes('id="openAiProjectProposal"')) {
                return html;
            }

            const marker = `
                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>`;

            if (!html.includes(marker)) return html;

            const entry = `

                    <button
                        id="openAiProjectProposal"
                        type="button"
                        class="sidebarButton"
                        aria-haspopup="dialog">
                        Proponer proyectos
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
            "openAiProjectProposal"
        );
        if (!entry || entry.dataset.aiProjectBound) return;

        entry.dataset.aiProjectBound = "true";
        entry.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (
            !this.document?.body ||
            this.document.getElementById?.(
                "aiProjectProposalDialog"
            )
        ) {
            return;
        }

        const dialog = this.document.createElement("dialog");
        dialog.id = "aiProjectProposalDialog";
        dialog.className =
            "settingsDialog aiProjectProposalDialog";
        dialog.setAttribute(
            "aria-labelledby",
            "aiProjectProposalTitle"
        );
        this.document.body.appendChild(dialog);
    }

    open() {
        this.ensureDialog();
        this.renderDialog();
        const dialog = this.document?.getElementById?.(
            "aiProjectProposalDialog"
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
        const dialog = this.document?.getElementById?.(
            "aiProjectProposalDialog"
        );
        if (dialog?.open && typeof dialog.close === "function") {
            dialog.close();
        }
    }

    isEnabled() {
        return Boolean(
            this.app?.aiPreferences?.isEnabled?.()
        );
    }

    getEligibleTasks() {
        const taskService = this.app?.taskService;
        const tasks = taskService?.getAllTasks?.() || [];

        return tasks.filter(task =>
            task.status === "PENDING" &&
            !task.isProject &&
            !task.parentTaskId &&
            !task.recurrence &&
            (taskService?.getDirectSubtasks?.(task.id)?.length ?? 0) === 0
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
                "Analizar complejidad de tareas pendientes",
            includeTaskIds: true
        });

        const eligibleById = new Map(
            eligibleTasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "projectProposal",
            tasks: base.tasks.map(task => ({
                ...task,
                taskVersion: Number(
                    eligibleById.get(String(task.taskId))?.version ?? 1
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
        const dialog = this.document?.getElementById?.(
            "aiProjectProposalDialog"
        );
        if (!dialog) return;

        dialog.innerHTML = `
            <style>
                .aiProjectProposalDialog { width:min(780px, calc(100vw - 32px)); }
                .aiProjectProposalList { display:flex; flex-direction:column; gap:12px; margin-top:12px; }
                .aiProjectProposalItem { display:grid; grid-template-columns:auto 1fr; gap:8px 10px; padding:12px; border:1px solid var(--border-color, #d8d8d8); border-radius:8px; }
                .aiProjectProposalItem input { margin-top:4px; }
                .aiProjectProposalTask { font-weight:600; }
                .aiProjectProposalReason { margin:4px 0 8px; line-height:1.4; }
                .aiProjectProposalSubtasks { margin:0; padding-left:20px; }
                .aiProjectProposalActions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="aiProjectProposalTitle">Propuesta de proyectos</h2>
                <button id="closeAiProjectProposal" type="button" class="iconButton" aria-label="Cerrar propuesta" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">${this.getBodyHtml()}</div>
            <div class="settingsDialogFooter">
                <button id="cancelAiProjectProposal" type="button" class="tertiaryAction">Cerrar</button>
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
                <p>La IA puede detectar tareas que representan un resultado con varias acciones y sugerir convertirlas en proyectos mediante subtareas concretas. La tarea original se conserva como proyecto.</p>
                <p class="settingsHint">Se analizan sólo tareas pendientes de nivel superior, no recurrentes y que todavía no tengan subtareas. No es necesario convertir todas.</p>
                <p class="settingsHint">Tareas disponibles para analizar: ${eligibleCount}.</p>
                ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}
                ${this.proposal ? this.getProposalHtml() : ""}
                <div class="aiProjectProposalActions">
                    ${this.proposal ? `<button id="applyAiProjectProposal" type="button" class="primaryAction" ${selectedCount ? "" : "disabled"}>Crear ${selectedCount} ${selectedCount === 1 ? "proyecto" : "proyectos"}</button>` : ""}
                    <button id="generateAiProjectProposal" type="button" class="secondaryAction" ${this.loading || eligibleCount === 0 ? "disabled" : ""}>${this.loading ? "Analizando…" : this.proposal ? "Generar otra propuesta" : "Generar propuesta"}</button>
                    ${this.proposal ? '<button id="discardAiProjectProposal" type="button" class="tertiaryAction">Descartar propuesta</button>' : ""}
                </div>
            </section>`;
    }

    getProposalHtml() {
        const items = Array.isArray(this.proposal?.items)
            ? this.proposal.items
            : [];

        if (!items.length) {
            return `<p class="settingsHint">La IA no encontró tareas cuya descomposición justifique convertirlas en proyecto.</p>`;
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
            const subtasks = item.subtaskTitles
                .map(title => `<li>${escapeHtml(title)}</li>`)
                .join("");

            return `
                <label class="aiProjectProposalItem">
                    <input type="checkbox" data-ai-project-index="${index}" ${checked}>
                    <div>
                        <div class="aiProjectProposalTask">${escapeHtml(task?.title || "Tarea")}</div>
                        <p class="aiProjectProposalReason">${escapeHtml(item.reason || "")}</p>
                        <strong>Subtareas propuestas</strong>
                        <ul class="aiProjectProposalSubtasks">${subtasks}</ul>
                    </div>
                </label>`;
        }).join("");

        return `
            <div class="aiProjectProposalList">${html}</div>
            <p class="settingsHint">${selectedCount} de ${items.length} propuestas seleccionadas. Las subtareas se crean sólo después de confirmar.</p>`;
    }

    getSelectedItems() {
        const items = Array.isArray(this.proposal?.items)
            ? this.proposal.items
            : [];

        return items.filter(item => item?.selected !== false);
    }

    bindDialogEvents() {
        this.document?.getElementById?.(
            "closeAiProjectProposal"
        )?.addEventListener("click", () => this.close());
        this.document?.getElementById?.(
            "cancelAiProjectProposal"
        )?.addEventListener("click", () => this.close());
        this.document?.getElementById?.(
            "generateAiProjectProposal"
        )?.addEventListener("click", () => this.generate());
        this.document?.getElementById?.(
            "applyAiProjectProposal"
        )?.addEventListener("click", () => this.confirmAndApply());
        this.document?.getElementById?.(
            "discardAiProjectProposal"
        )?.addEventListener("click", () => {
            this.proposal = null;
            this.error = "";
            this.renderDialog();
        });
        this.document?.querySelectorAll?.(
            "[data-ai-project-index]"
        )?.forEach(input =>
            input.addEventListener("change", event => {
                const index = Number(
                    event.target.dataset.aiProjectIndex
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
        if (this.loading || !this.isEnabled()) return null;

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
                "No hay tareas pendientes aptas para analizar.";
            this.renderDialog();
            return null;
        }

        const question = [
            "Detectá únicamente tareas que representen un resultado suficientemente complejo como para beneficiarse claramente de convertirse en proyecto.",
            "Sé conservador: no conviertas una tarea simple sólo porque pueda describirse con varios verbos.",
            `Para cada tarea elegida proponé entre ${MIN_SUBTASKS} y ${MAX_SUBTASKS} subtareas concretas, accionables, no redundantes y redactadas como acciones breves.`,
            "No inventes personas, fechas, lugares, recursos, compromisos ni dependencias que no estén respaldados por los datos recibidos.",
            "La tarea original seguirá existiendo y funcionará como proyecto; por eso no repitas su título como subtarea.",
            "Devolvé exclusivamente JSON válido, sin Markdown ni texto adicional, con esta forma exacta:",
            '{"proposals":[{"taskId":"id exacto recibido","reason":"motivo breve en español","subtasks":["acción 1","acción 2"]}]}',
            "Cada taskId debe copiar exactamente un taskId recibido. Si ninguna tarea justifica una descomposición, devolvé {\"proposals\":[]}."
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
            assertAiStructuredResponseComplete(
                response,
                { kind: "La propuesta de proyectos" }
            );
            const parsed = parseProjectProposals(
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
                "Seleccioná al menos una propuesta para aplicar."
            );
        }

        const validated = [];
        const seen = new Set();

        for (const item of selected) {
            const taskId = String(item?.taskId || "").trim();
            if (!taskId || seen.has(taskId)) {
                throw new Error(
                    "La propuesta contiene una referencia de tarea inválida o duplicada."
                );
            }

            const task = this.app?.taskService
                ?.getTaskById?.(taskId);
            const directSubtasks = this.app?.taskService
                ?.getDirectSubtasks?.(taskId) || [];

            if (
                !task ||
                task.status !== "PENDING" ||
                task.isProject ||
                task.parentTaskId ||
                task.recurrence ||
                directSubtasks.length > 0 ||
                Number(task.version ?? 1) !==
                    Number(item.taskVersion ?? 1)
            ) {
                throw new Error(
                    "Una de las tareas cambió desde que se generó la propuesta. Generá una propuesta nueva antes de aplicar cambios."
                );
            }

            const titles = (item.subtaskTitles || [])
                .map(normalizeTitle)
                .filter(Boolean);
            if (
                titles.length < MIN_SUBTASKS ||
                titles.length > MAX_SUBTASKS ||
                new Set(titles).size !== titles.length
            ) {
                throw new Error(
                    "Una de las propuestas contiene subtareas inválidas. Generá una propuesta nueva."
                );
            }

            seen.add(taskId);
            validated.push({ task, titles });
        }

        return validated;
    }

    async confirmAndApply() {
        let proposals;

        try {
            proposals = this.validateSelectedItems();
        } catch (error) {
            await Dialog.alert(error.message, {
                title: "No se puede aplicar la propuesta"
            });
            return 0;
        }

        const subtaskCount = proposals.reduce(
            (total, proposal) =>
                total + proposal.titles.length,
            0
        );
        const confirmed = await Dialog.confirmAsync(
            `Se convertirán ${proposals.length} ${proposals.length === 1 ? "tarea" : "tareas"} en proyecto y se crearán ${subtaskCount} subtareas. La tarea original se conservará como proyecto.`,
            {
                title: "Crear proyectos y subtareas",
                confirmLabel: "Crear proyectos",
                cancelLabel: "Cancelar"
            }
        );

        if (!confirmed) return 0;

        try {
            for (const proposal of proposals) {
                for (const title of proposal.titles) {
                    this.app.taskService.createSubtask(
                        proposal.task.id,
                        title
                    );
                }
            }

            this.proposal = null;
            this.error = "";
            this.app.render?.();
            this.renderDialog();

            await Dialog.alert(
                `Se crearon ${proposals.length} ${proposals.length === 1 ? "proyecto" : "proyectos"} con ${subtaskCount} subtareas.`,
                { title: "Proyectos creados" }
            );

            return proposals.length;
        } catch (error) {
            await Dialog.alert(
                error?.message ||
                    "No se pudieron crear los proyectos seleccionados.",
                { title: "Error al aplicar la propuesta" }
            );
            return 0;
        }
    }
}
