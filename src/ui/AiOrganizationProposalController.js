import {
    buildAiTaskContext
} from "../core/AiTaskContext.js";
import { Dialog } from "../components/Dialog.js";
import {
    applyAtomicTaskUpdates
} from "../core/AtomicTaskUpdates.js";
import { escapeHtml } from "./escapeHtml.js";

function sameStringArray(first = [], second = []) {
    const a = [...first].map(String).sort();
    const b = [...second].map(String).sort();
    return a.length === b.length &&
        a.every((value, index) => value === b[index]);
}

function extractJsonObject(answer) {
    const text = String(answer || "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace < firstBrace) {
        throw new Error(
            "La IA devolvió una propuesta con formato inválido. Intentá nuevamente."
        );
    }

    try {
        return JSON.parse(
            text.slice(firstBrace, lastBrace + 1)
        );
    } catch {
        throw new Error(
            "La IA devolvió una propuesta con formato inválido. Intentá nuevamente."
        );
    }
}

export function parseOrganizationProposals(
    answer,
    tasks,
    { areas = [], contexts = [], tags = [] } = {}
) {
    const parsed = extractJsonObject(answer);
    const tasksById = new Map(
        (tasks || []).map(task => [String(task?.id || ""), task])
    );
    const areaIds = new Set(
        areas.map(area => String(area?.id || "")).filter(Boolean)
    );
    const contextIds = new Set(
        contexts.map(context => String(context?.id || "")).filter(Boolean)
    );
    const tagIds = new Set(
        tags.map(tag => String(tag?.id || "")).filter(Boolean)
    );
    const seen = new Set();
    const proposals = Array.isArray(parsed?.proposals)
        ? parsed.proposals
        : [];

    return proposals
        .map(item => {
            const taskId = String(item?.taskId || "").trim();
            const task = tasksById.get(taskId);

            if (
                !task ||
                seen.has(taskId) ||
                task.status !== "PENDING"
            ) {
                return null;
            }

            const areaId = item?.areaId === undefined ||
                item?.areaId === null ||
                String(item.areaId).trim() === ""
                ? undefined
                : String(item.areaId).trim();
            const contextId = item?.contextId === undefined ||
                item?.contextId === null ||
                String(item.contextId).trim() === ""
                ? undefined
                : String(item.contextId).trim();
            const requestedTagIds = Array.isArray(item?.addTagIds)
                ? item.addTagIds.map(value => String(value).trim())
                : [];

            if (
                areaId !== undefined &&
                !areaIds.has(areaId)
            ) {
                return null;
            }

            if (
                contextId !== undefined &&
                !contextIds.has(contextId)
            ) {
                return null;
            }

            if (requestedTagIds.some(id => !id || !tagIds.has(id))) {
                return null;
            }

            const currentTagIds = [...(task.tagIds || [])].map(String);
            const addTagIds = [
                ...new Set(requestedTagIds)
            ].filter(id => !currentTagIds.includes(id));
            const changes = {};

            if (
                areaId !== undefined &&
                areaId !== String(task.areaId || "")
            ) {
                changes.areaId = areaId;
            }

            if (
                contextId !== undefined &&
                contextId !== String(task.contextId || "")
            ) {
                changes.contextId = contextId;
            }

            if (addTagIds.length) {
                changes.addTagIds = addTagIds;
            }

            if (!Object.keys(changes).length) {
                return null;
            }

            seen.add(taskId);

            return {
                taskId,
                currentAreaId: task.areaId ?? null,
                currentContextId: task.contextId ?? null,
                currentTagIds,
                ...changes,
                reason: String(item?.reason || "")
                    .trim()
                    .slice(0, 320) ||
                    "Organización sugerida por el análisis de la IA."
            };
        })
        .filter(Boolean);
}

export class AiOrganizationProposalController {

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
            if (html.includes('id="openAiOrganizationProposal"')) {
                return html;
            }

            const marker = `
                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>`;

            if (!html.includes(marker)) return html;

            const entry = `

                    <button
                        id="openAiOrganizationProposal"
                        type="button"
                        class="sidebarButton"
                        aria-haspopup="dialog">
                        Proponer organización
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
            "openAiOrganizationProposal"
        );
        if (!entry || entry.dataset.aiOrganizationBound) return;

        entry.dataset.aiOrganizationBound = "true";
        entry.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (
            !this.document?.body ||
            this.document.getElementById(
                "aiOrganizationProposalDialog"
            )
        ) {
            return;
        }

        const dialog = this.document.createElement("dialog");
        dialog.id = "aiOrganizationProposalDialog";
        dialog.className =
            "settingsDialog aiOrganizationProposalDialog";
        dialog.setAttribute(
            "aria-labelledby",
            "aiOrganizationProposalTitle"
        );
        this.document.body.appendChild(dialog);
    }

    isEnabled() {
        return Boolean(
            this.app?.aiPreferences?.isEnabled?.()
        );
    }

    getPendingTasks() {
        return (
            this.app.taskService?.repository?.getAll?.() || []
        ).filter(task => task.status === "PENDING");
    }

    getEntities() {
        return {
            areas: this.app.areaService?.getAllAreas?.() || [],
            contexts: this.app.contextService?.getAllContexts?.() || [],
            tags: this.app.tagService?.getAllTags?.() || []
        };
    }

    buildContext() {
        const tasks = this.getPendingTasks();
        const entities = this.getEntities();
        const base = buildAiTaskContext({
            tasks,
            areas: entities.areas,
            contexts: entities.contexts,
            tags: entities.tags,
            question:
                "Proponer organización por área, contexto y etiquetas para tareas pendientes",
            includeTaskIds: true
        });

        const tasksById = new Map(
            tasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "organizationProposal",
            tasks: base.tasks.map(task => {
                const source = tasksById.get(String(task.taskId));
                return {
                    ...task,
                    currentAreaId: source?.areaId ?? null,
                    currentContextId: source?.contextId ?? null,
                    currentTagIds: [...(source?.tagIds || [])]
                };
            }),
            availableAreas: entities.areas.map(area => ({
                id: area.id,
                name: area.name
            })),
            availableContexts: entities.contexts.map(context => ({
                id: context.id,
                name: context.name
            })),
            availableTags: entities.tags.map(tag => ({
                id: tag.id,
                name: tag.name
            })),
            aiProvider:
                this.app?.aiPreferences?.getProvider?.() ||
                "gemini",
            aiModel:
                this.app?.aiPreferences?.getModel?.() ||
                "gemini-3.7-flash"
        };
    }

    open() {
        this.ensureDialog();
        this.renderDialog();
        const dialog = this.document?.getElementById?.(
            "aiOrganizationProposalDialog"
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
            "aiOrganizationProposalDialog"
        );
        if (dialog?.open && typeof dialog.close === "function") {
            dialog.close();
        }
    }

    renderDialog() {
        const dialog = this.document?.getElementById?.(
            "aiOrganizationProposalDialog"
        );
        if (!dialog) return;

        dialog.innerHTML = `
            <style>
                .aiOrganizationProposalDialog { width:min(780px, calc(100vw - 32px)); }
                .aiOrganizationProposalList { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
                .aiOrganizationProposalItem { display:grid; grid-template-columns:auto 1fr; gap:8px 10px; padding:10px 12px; border:1px solid var(--border-color, #d8d8d8); border-radius:8px; }
                .aiOrganizationProposalItem input { margin-top:3px; }
                .aiOrganizationProposalTitle { font-weight:600; }
                .aiOrganizationProposalChanges { margin-top:4px; display:flex; flex-direction:column; gap:2px; font-size:.92rem; }
                .aiOrganizationProposalReason { grid-column:2; margin:4px 0 0; line-height:1.4; }
                .aiOrganizationProposalActions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="aiOrganizationProposalTitle">Propuesta de organización</h2>
                <button id="closeAiOrganizationProposal" type="button" class="iconButton" aria-label="Cerrar propuesta" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">${this.getBodyHtml()}</div>
            <div class="settingsDialogFooter">
                <button id="cancelAiOrganizationProposal" type="button" class="tertiaryAction">Cerrar</button>
            </div>`;

        this.bindDialogEvents();
    }

    getBodyHtml() {
        if (!this.isEnabled()) {
            return `<p class="settingsHint">Activá la asistencia con IA desde Configuración → IA para generar propuestas.</p>`;
        }

        const pendingCount = this.getPendingTasks().length;
        const entities = this.getEntities();
        const selectedCount = this.getSelectedItems().length;
        const hasEntities =
            entities.areas.length ||
            entities.contexts.length ||
            entities.tags.length;

        return `
            <section class="settingsToolPanel">
                <p>La IA puede sugerir área, contexto y etiquetas usando únicamente opciones que ya existen. Las etiquetas sólo se agregan; nunca se quitan automáticamente.</p>
                <p class="settingsHint">Tareas pendientes disponibles: ${pendingCount}. Áreas: ${entities.areas.length}; contextos: ${entities.contexts.length}; etiquetas: ${entities.tags.length}.</p>
                ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}
                ${this.proposal ? this.getProposalHtml() : ""}
                <div class="aiOrganizationProposalActions">
                    ${this.proposal ? `<button id="applyAiOrganizationProposal" type="button" class="primaryAction" ${selectedCount ? "" : "disabled"}>Aplicar ${selectedCount} ${selectedCount === 1 ? "cambio" : "cambios"}</button>` : ""}
                    <button id="generateAiOrganizationProposal" type="button" class="secondaryAction" ${this.loading || pendingCount === 0 || !hasEntities ? "disabled" : ""}>${this.loading ? "Analizando…" : this.proposal ? "Generar otra propuesta" : "Generar propuesta"}</button>
                    ${this.proposal ? '<button id="discardAiOrganizationProposal" type="button" class="tertiaryAction">Descartar propuesta</button>' : ""}
                </div>
            </section>`;
    }

    getProposalHtml() {
        const items = Array.isArray(this.proposal?.items)
            ? this.proposal.items
            : [];

        if (!items.length) {
            return `<p class="settingsHint">La IA no sugirió cambios de organización para las tareas analizadas.</p>`;
        }

        const tasksById = new Map(
            this.getPendingTasks().map(task => [task.id, task])
        );
        const entities = this.getEntities();
        const areasById = new Map(
            entities.areas.map(area => [String(area.id), area.name])
        );
        const contextsById = new Map(
            entities.contexts.map(context => [String(context.id), context.name])
        );
        const tagsById = new Map(
            entities.tags.map(tag => [String(tag.id), tag.name])
        );
        const selectedCount = this.getSelectedItems().length;
        const html = items.map((item, index) => {
            const task = tasksById.get(item.taskId);
            const changes = [];

            if (item.areaId !== undefined) {
                const from = task?.areaId
                    ? areasById.get(String(task.areaId)) || "Área actual"
                    : "Sin área";
                changes.push(
                    `Área: ${escapeHtml(from)} → <strong>${escapeHtml(areasById.get(String(item.areaId)) || "Área")}</strong>`
                );
            }

            if (item.contextId !== undefined) {
                const from = task?.contextId
                    ? contextsById.get(String(task.contextId)) || "Contexto actual"
                    : "Sin contexto";
                changes.push(
                    `Contexto: ${escapeHtml(from)} → <strong>${escapeHtml(contextsById.get(String(item.contextId)) || "Contexto")}</strong>`
                );
            }

            if (item.addTagIds?.length) {
                const names = item.addTagIds
                    .map(id => tagsById.get(String(id)) || "Etiqueta")
                    .join(", ");
                changes.push(
                    `Agregar etiquetas: <strong>${escapeHtml(names)}</strong>`
                );
            }

            return `
                <label class="aiOrganizationProposalItem">
                    <input type="checkbox" data-ai-organization-index="${index}" ${item.selected !== false ? "checked" : ""}>
                    <div>
                        <div class="aiOrganizationProposalTitle">${escapeHtml(task?.title || "Tarea")}</div>
                        <div class="aiOrganizationProposalChanges">${changes.map(change => `<div>${change}</div>`).join("")}</div>
                    </div>
                    <p class="aiOrganizationProposalReason">${escapeHtml(item.reason || "Sin explicación adicional.")}</p>
                </label>`;
        }).join("");

        return `
            <div class="aiOrganizationProposalList">${html}</div>
            <p class="settingsHint">${selectedCount} de ${items.length} propuestas seleccionadas.</p>`;
    }

    getSelectedItems() {
        const items = Array.isArray(this.proposal?.items)
            ? this.proposal.items
            : [];
        return items.filter(item => item?.selected !== false);
    }

    bindDialogEvents() {
        this.document?.getElementById?.(
            "closeAiOrganizationProposal"
        )?.addEventListener("click", () => this.close());
        this.document?.getElementById?.(
            "cancelAiOrganizationProposal"
        )?.addEventListener("click", () => this.close());
        this.document?.getElementById?.(
            "generateAiOrganizationProposal"
        )?.addEventListener("click", () => this.generate());
        this.document?.getElementById?.(
            "applyAiOrganizationProposal"
        )?.addEventListener("click", () => this.confirmAndApply());
        this.document?.getElementById?.(
            "discardAiOrganizationProposal"
        )?.addEventListener("click", () => {
            this.proposal = null;
            this.error = "";
            this.renderDialog();
        });
        this.document?.querySelectorAll?.(
            "[data-ai-organization-index]"
        )?.forEach(input =>
            input.addEventListener("change", event => {
                const index = Number(
                    event.target.dataset.aiOrganizationIndex
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
            this.error = "Configurá primero la conexión con Apps Script.";
            this.renderDialog();
            return null;
        }

        const gateway = this.app.syncEngine?.gateway;
        if (!gateway?.aiQuery) {
            this.error = "La instalación actual de Apps Script todavía no admite consultas de IA.";
            this.renderDialog();
            return null;
        }

        const tasks = this.getPendingTasks();
        const entities = this.getEntities();
        const context = this.buildContext();

        if (!tasks.length) {
            this.error = "No hay tareas pendientes para analizar.";
            this.renderDialog();
            return null;
        }

        const question = [
            "Proponé mejoras de organización para las tareas pendientes recibidas usando sólo las áreas, contextos y etiquetas disponibles en el contexto.",
            "Área y contexto son asociaciones únicas: sólo proponé reemplazarlos cuando haya una justificación semántica clara. No hace falta cambiar los que ya son razonables.",
            "Las etiquetas son múltiples: sólo podés proponer agregar etiquetas existentes; nunca quitar etiquetas.",
            "No inventes áreas, contextos, etiquetas ni IDs. Omití cualquier tarea para la que no haya un cambio suficientemente útil y justificado.",
            "Devolvé exclusivamente JSON válido, sin Markdown ni texto adicional, con esta forma exacta:",
            '{"proposals":[{"taskId":"id exacto","areaId":"id opcional","contextId":"id opcional","addTagIds":["id opcional"],"reason":"motivo breve en español"}]}',
            "Omití del objeto areaId, contextId o addTagIds cuando no propongas ese tipo de cambio."
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
            const items = parseOrganizationProposals(
                response.answer,
                tasks,
                entities
            );

            this.proposal = {
                provider: response.provider || "",
                model: response.model || "",
                items: items.map(item => ({
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

        const entities = this.getEntities();
        const areaIds = new Set(
            entities.areas.map(area => String(area.id))
        );
        const contextIds = new Set(
            entities.contexts.map(context => String(context.id))
        );
        const tagIds = new Set(
            entities.tags.map(tag => String(tag.id))
        );
        const seen = new Set();
        const validated = [];

        for (const item of selected) {
            const taskId = String(item?.taskId || "").trim();
            if (!taskId || seen.has(taskId)) {
                throw new Error(
                    "La propuesta contiene una referencia de tarea inválida o duplicada."
                );
            }

            const task = this.app?.taskService?.getTaskById?.(taskId);
            if (!task || task.status !== "PENDING") {
                throw new Error(
                    "Una de las tareas propuestas ya no está pendiente. Generá una propuesta nueva antes de aplicar cambios."
                );
            }

            if (
                String(task.areaId || "") !==
                    String(item.currentAreaId || "") ||
                String(task.contextId || "") !==
                    String(item.currentContextId || "") ||
                !sameStringArray(
                    task.tagIds || [],
                    item.currentTagIds || []
                )
            ) {
                throw new Error(
                    `“${task.title}” cambió su organización desde que se generó la propuesta. Generá una propuesta nueva.`
                );
            }

            if (
                item.areaId !== undefined &&
                !areaIds.has(String(item.areaId))
            ) {
                throw new Error("La propuesta contiene un área inexistente.");
            }

            if (
                item.contextId !== undefined &&
                !contextIds.has(String(item.contextId))
            ) {
                throw new Error("La propuesta contiene un contexto inexistente.");
            }

            const addTagIds = [...new Set(
                (item.addTagIds || []).map(String)
            )];
            if (addTagIds.some(id => !tagIds.has(id))) {
                throw new Error("La propuesta contiene una etiqueta inexistente.");
            }

            const changes = {};
            if (item.areaId !== undefined) {
                changes.areaId = item.areaId;
            }
            if (item.contextId !== undefined) {
                changes.contextId = item.contextId;
            }
            if (addTagIds.length) {
                changes.tagIds = [
                    ...new Set([
                        ...(task.tagIds || []),
                        ...addTagIds
                    ])
                ];
            }

            if (!Object.keys(changes).length) {
                throw new Error(
                    "Una propuesta seleccionada ya no contiene cambios aplicables."
                );
            }

            seen.add(taskId);
            validated.push({ task, changes });
        }

        return validated;
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
            `Se aplicarán propuestas de organización sobre ${changes.length} ${changes.length === 1 ? "tarea" : "tareas"}.`,
            {
                title: "Aplicar organización sugerida",
                confirmLabel: "Aplicar cambios",
                cancelLabel: "Cancelar"
            }
        );

        if (!confirmed) return 0;

        try {
            applyAtomicTaskUpdates(
                this.app.taskService,
                changes.map(entry => ({
                    id: entry.task.id,
                    changes: entry.changes
                }))
            );

            this.proposal = null;
            this.error = "";
            this.app.render?.();
            this.renderDialog();

            await Dialog.alert(
                `Se actualizaron ${changes.length} ${changes.length === 1 ? "tarea" : "tareas"}.`,
                { title: "Organización actualizada" }
            );

            return changes.length;
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
