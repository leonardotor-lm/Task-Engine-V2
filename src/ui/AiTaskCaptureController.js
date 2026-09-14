import { Dialog } from "../components/Dialog.js";
import { escapeHtml } from "./escapeHtml.js";
import {
    assertAiStructuredResponseComplete,
    requireAiStructuredCollection
} from "../core/AiStructuredResponse.js";

const MAX_SOURCE_LENGTH = 6000;
const MAX_TASKS = 10;
const MAX_TITLE_LENGTH = 140;
const MAX_DESCRIPTION_LENGTH = 1200;
const MAX_AMBIGUITIES = 4;
const MAX_AMBIGUITY_LENGTH = 240;

const PRIORITY_LABELS = Object.freeze({
    1: "Baja",
    2: "Media",
    3: "Alta",
    4: "Crítica"
});

function normalizeText(value, maxLength) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

function normalizeEntityId(value, validIds, label, ambiguities) {
    const normalized = String(value || "").trim();
    if (!normalized) return null;
    if (validIds.has(normalized)) return normalized;
    ambiguities.push(`Se descartó ${label} porque no coincide con una opción existente.`);
    return null;
}

function normalizeDate(value, ambiguities) {
    const normalized = String(value || "").trim();
    if (!normalized) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
    if (match) {
        const date = new Date(`${normalized}T12:00:00Z`);
        if (
            date.getUTCFullYear() === Number(match[1]) &&
            date.getUTCMonth() + 1 === Number(match[2]) &&
            date.getUTCDate() === Number(match[3])
        ) {
            return normalized;
        }
    }
    ambiguities.push("Se descartó una fecha que no era válida.");
    return null;
}

function normalizeTime(value, dueDate, ambiguities) {
    const normalized = String(value || "").trim();
    if (!normalized) return null;
    if (!dueDate) {
        ambiguities.push("Se descartó la hora porque no había una fecha clara.");
        return null;
    }
    if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
        return normalized;
    }
    ambiguities.push("Se descartó una hora que no era válida.");
    return null;
}

function normalizePriority(value, ambiguities) {
    if (value === null || value === undefined || value === "") return 0;
    const normalized = Number(value);
    if (Number.isInteger(normalized) && normalized >= 0 && normalized <= 4) {
        return normalized;
    }
    ambiguities.push("Se descartó una prioridad que no era válida.");
    return 0;
}

function normalizeAmbiguities(value) {
    const items = Array.isArray(value)
        ? value
        : value
            ? [value]
            : [];
    return items
        .map(item => normalizeText(item, MAX_AMBIGUITY_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_AMBIGUITIES);
}

export function parseTaskCaptureProposals(
    answer,
    { areas = [], contexts = [], tags = [] } = {}
) {
    const text = String(answer || "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace < firstBrace) {
        throw new Error("La IA devolvió una propuesta con formato inválido. Intentá nuevamente.");
    }

    let parsed;
    try {
        parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
        throw new Error("La IA devolvió una propuesta con formato inválido. Intentá nuevamente.");
    }

    const items = requireAiStructuredCollection(
        parsed,
        "tasks",
        { kind: "una propuesta de tareas" }
    );
    const seen = new Set();

    const areaIds = new Set(areas.map(area => String(area.id)));
    const contextIds = new Set(contexts.map(context => String(context.id)));
    const tagIds = new Set(tags.map(tag => String(tag.id)));

    return items.slice(0, MAX_TASKS).map(item => {
        const title = normalizeText(item?.title, MAX_TITLE_LENGTH);
        const description = String(item?.description || "")
            .trim()
            .slice(0, MAX_DESCRIPTION_LENGTH);
        const key = title.toLocaleLowerCase("es");
        if (!title || seen.has(key)) return null;
        seen.add(key);
        const ambiguities = normalizeAmbiguities(item?.ambiguities);
        const dueDate = normalizeDate(item?.dueDate, ambiguities);
        const dueTime = normalizeTime(item?.dueTime, dueDate, ambiguities);
        const areaId = normalizeEntityId(
            item?.areaId,
            areaIds,
            "el área",
            ambiguities
        );
        const contextId = normalizeEntityId(
            item?.contextId,
            contextIds,
            "el contexto",
            ambiguities
        );
        const normalizedTagIds = Array.isArray(item?.tagIds)
            ? [...new Set(item.tagIds.map(id => String(id).trim()).filter(Boolean))]
            : [];
        const validTagIds = normalizedTagIds.filter(id => tagIds.has(id));
        if (validTagIds.length !== normalizedTagIds.length) {
            ambiguities.push("Se descartaron etiquetas que no existen en Task Engine.");
        }
        return {
            title,
            description,
            dueDate,
            dueTime,
            priority: normalizePriority(item?.priority, ambiguities),
            areaId,
            contextId,
            tagIds: validTagIds,
            ambiguities: [...new Set(ambiguities)].slice(0, MAX_AMBIGUITIES)
        };
    }).filter(Boolean);
}

export class AiTaskCaptureController {

    constructor(app, { documentRef = globalThis.document } = {}) {
        this.app = app;
        this.document = documentRef;
        this.started = false;
        this.loading = false;
        this.error = "";
        this.sourceText = "";
        this.proposal = null;
    }

    start() {
        if (this.started) return;
        this.started = true;
        this.wrapAppRender();
        this.apply();
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
        this.ensureSidebarEntry();
        this.bindSidebarEntry();
        this.ensureDialog();
    }

    ensureSidebarEntry() {
        if (this.document?.getElementById?.("openAiTaskCapture")) return;
        const body = this.document?.querySelector?.(".aiSidebarToolsBody");
        if (!body || !this.document?.createElement) return;

        const button = this.document.createElement("button");
        button.id = "openAiTaskCapture";
        button.type = "button";
        button.className = "sidebarButton";
        button.setAttribute("aria-haspopup", "dialog");
        button.textContent = "Añadir con lenguaje natural";

        const assistant = body.querySelector?.("#openAiAssistant");
        if (assistant?.nextSibling) {
            body.insertBefore(button, assistant.nextSibling);
        } else {
            body.appendChild(button);
        }
    }

    bindSidebarEntry() {
        const entry = this.document?.getElementById?.("openAiTaskCapture");
        if (!entry || entry.dataset.aiTaskCaptureBound) return;
        entry.dataset.aiTaskCaptureBound = "true";
        entry.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (!this.document?.body || this.document.getElementById?.("aiTaskCaptureDialog")) return;
        const dialog = this.document.createElement("dialog");
        dialog.id = "aiTaskCaptureDialog";
        dialog.className = "settingsDialog aiTaskCaptureDialog";
        dialog.setAttribute("aria-labelledby", "aiTaskCaptureTitle");
        this.document.body.appendChild(dialog);
    }

    isEnabled() {
        return Boolean(this.app?.aiPreferences?.isEnabled?.());
    }

    open() {
        this.ensureDialog();
        this.renderDialog();
        const dialog = this.document?.getElementById?.("aiTaskCaptureDialog");
        if (dialog && !dialog.open && typeof dialog.showModal === "function") dialog.showModal();
    }

    close() {
        const dialog = this.document?.getElementById?.("aiTaskCaptureDialog");
        if (dialog?.open && typeof dialog.close === "function") dialog.close();
    }

    renderDialog() {
        const dialog = this.document?.getElementById?.("aiTaskCaptureDialog");
        if (!dialog) return;
        dialog.innerHTML = `
            <style>
                .aiTaskCaptureDialog { width:min(760px, calc(100vw - 32px)); }
                .aiTaskCaptureInput { width:100%; box-sizing:border-box; min-height:150px; resize:vertical; }
                .aiTaskCaptureList { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
                .aiTaskCaptureItem { display:grid; grid-template-columns:auto 1fr; gap:8px 10px; padding:10px 12px; border:1px solid var(--color-border); border-radius:8px; }
                .aiTaskCaptureItem input { margin-top:3px; }
                .aiTaskCaptureItemTitle { font-weight:600; }
                .aiTaskCaptureItemDescription { margin:4px 0 0; line-height:1.4; white-space:pre-wrap; }
                .aiTaskCaptureMetadata { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
                .aiTaskCaptureMetadata span { padding:3px 7px; border:1px solid var(--color-border); border-radius:999px; font-size:.86em; }
                .aiTaskCaptureAmbiguities { margin:8px 0 0; padding-left:18px; color:var(--color-text-muted); line-height:1.35; }
                .aiTaskCaptureActions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="aiTaskCaptureTitle">Añadir con lenguaje natural</h2>
                <button id="closeAiTaskCapture" type="button" class="iconButton" aria-label="Cerrar" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">${this.getBodyHtml()}</div>
            <div class="settingsDialogFooter">
                <button id="cancelAiTaskCapture" type="button" class="tertiaryAction">Cerrar</button>
            </div>`;
        this.bindDialogEvents();
    }

    getBodyHtml() {
        if (!this.isEnabled()) {
            return `<p class="settingsHint">Activá la asistencia con IA desde Configuración → IA para usar esta herramienta.</p>`;
        }
        const selectedCount = this.getSelectedItems().length;
        return `
            <section class="settingsToolPanel">
                <p>Escribí una instrucción breve o una lista. Task Engine propondrá tareas y reconocerá sólo los datos suficientemente claros.</p>
                <label for="aiTaskCaptureSource"><strong>Texto a procesar</strong></label>
                <textarea id="aiTaskCaptureSource" class="aiTaskCaptureInput" maxlength="${MAX_SOURCE_LENGTH}" placeholder="Ej.: Pagar seguro del auto el viernes prioridad alta #trámites">${escapeHtml(this.sourceText)}</textarea>
                <p class="settingsHint">Puede reconocer fecha, hora, prioridad, etiquetas existentes, área y contexto. Revisá siempre la interpretación antes de crear.</p>
                ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}
                ${this.proposal ? this.getProposalHtml() : ""}
                <div class="aiTaskCaptureActions">
                    ${this.proposal ? `<button id="applyAiTaskCapture" type="button" class="primaryAction" ${selectedCount ? "" : "disabled"}>Crear ${selectedCount} ${selectedCount === 1 ? "tarea" : "tareas"}</button>` : ""}
                    <button id="generateAiTaskCapture" type="button" class="secondaryAction" ${this.loading ? "disabled" : ""}>${this.loading ? "Procesando…" : this.proposal ? "Generar otra propuesta" : "Generar propuesta"}</button>
                    ${this.proposal ? '<button id="discardAiTaskCapture" type="button" class="tertiaryAction">Descartar propuesta</button>' : ""}
                </div>
            </section>`;
    }

    getProposalHtml() {
        const items = Array.isArray(this.proposal?.items) ? this.proposal.items : [];
        if (!items.length) {
            return `<p class="settingsHint">La IA no detectó acciones suficientemente concretas para crear tareas.</p>`;
        }
        const html = items.map((item, index) => `
            <label class="aiTaskCaptureItem">
                <input type="checkbox" data-ai-task-capture-index="${index}" ${item.selected !== false ? "checked" : ""}>
                <div>
                    <div class="aiTaskCaptureItemTitle">${escapeHtml(item.title)}</div>
                    ${item.description ? `<p class="aiTaskCaptureItemDescription">${escapeHtml(item.description)}</p>` : ""}
                    ${this.getMetadataHtml(item)}
                    ${item.ambiguities?.length ? `<ul class="aiTaskCaptureAmbiguities">${item.ambiguities.map(message => `<li>${escapeHtml(message)}</li>`).join("")}</ul>` : ""}
                </div>
            </label>`).join("");
        return `<div class="aiTaskCaptureList">${html}</div>
            <p class="settingsHint">${this.getSelectedItems().length} de ${items.length} propuestas seleccionadas.</p>`;
    }

    getMetadataHtml(item) {
        const metadata = [];
        if (item.dueDate) {
            metadata.push(`Fecha: ${item.dueDate}${item.dueTime ? ` · ${item.dueTime}` : ""}`);
        }
        if (PRIORITY_LABELS[item.priority]) {
            metadata.push(`Prioridad: ${PRIORITY_LABELS[item.priority]}`);
        }
        const area = this.app?.areaService?.getAreaById?.(item.areaId);
        const context = this.app?.contextService?.getContextById?.(item.contextId);
        if (area) metadata.push(`Área: ${area.name}`);
        if (context) metadata.push(`Contexto: ${context.name}`);
        const tagNames = (item.tagIds || [])
            .map(id => this.app?.tagService?.getTagById?.(id)?.name)
            .filter(Boolean);
        if (tagNames.length) metadata.push(`Etiquetas: ${tagNames.join(", ")}`);
        if (!metadata.length) return '<div class="aiTaskCaptureMetadata"><span>Sin metadatos añadidos</span></div>';
        return `<div class="aiTaskCaptureMetadata">${metadata.map(value => `<span>${escapeHtml(value)}</span>`).join("")}</div>`;
    }

    getSelectedItems() {
        const items = Array.isArray(this.proposal?.items) ? this.proposal.items : [];
        return items.filter(item => item?.selected !== false);
    }

    bindDialogEvents() {
        this.document?.getElementById?.("closeAiTaskCapture")?.addEventListener("click", () => this.close());
        this.document?.getElementById?.("cancelAiTaskCapture")?.addEventListener("click", () => this.close());
        this.document?.getElementById?.("generateAiTaskCapture")?.addEventListener("click", () => this.generate());
        this.document?.getElementById?.("applyAiTaskCapture")?.addEventListener("click", () => this.confirmAndApply());
        this.document?.getElementById?.("discardAiTaskCapture")?.addEventListener("click", () => {
            this.captureSourceText();
            this.proposal = null;
            this.error = "";
            this.renderDialog();
        });
        this.document?.querySelectorAll?.("[data-ai-task-capture-index]")?.forEach(input =>
            input.addEventListener("change", event => {
                this.captureSourceText();
                const index = Number(event.target.dataset.aiTaskCaptureIndex);
                if (!Number.isInteger(index) || !this.proposal?.items?.[index]) return;
                this.proposal.items[index].selected = event.target.checked;
                this.renderDialog();
            })
        );
    }

    captureSourceText() {
        const input = this.document?.getElementById?.("aiTaskCaptureSource");
        if (input) this.sourceText = String(input.value || "").slice(0, MAX_SOURCE_LENGTH);
        return this.sourceText.trim();
    }

    buildContext() {
        return {
            requestType: "taskCapture",
            tasks: [],
            today: this.app?.getTodayString?.() || new Date().toISOString().slice(0, 10),
            sourceText: this.sourceText.trim(),
            availableAreas: this.app?.areaService?.getAllAreas?.().map(({ id, name }) => ({ id, name })) || [],
            availableContexts: this.app?.contextService?.getAllContexts?.().map(({ id, name }) => ({ id, name })) || [],
            availableTags: this.app?.tagService?.getAllTags?.().map(({ id, name }) => ({ id, name })) || [],
            aiProvider: this.app?.aiPreferences?.getProvider?.() || "gemini",
            aiModel: this.app?.aiPreferences?.getModel?.() || "gemini-3.7-flash"
        };
    }

    async generate() {
        if (this.loading || !this.isEnabled()) return null;
        const sourceText = this.captureSourceText();
        if (!sourceText) {
            this.error = "Escribí o pegá un texto para procesar.";
            this.renderDialog();
            return null;
        }
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

        const question = [
            "Convertí sourceText en tareas concretas. No inventes acciones ni metadatos.",
            "Interpretá fechas relativas usando today. Fecha: YYYY-MM-DD; hora: HH:MM; prioridad: 0 ninguna, 1 baja, 2 media, 3 alta, 4 crítica.",
            "Para área, contexto y etiquetas usá sólo IDs exactos de availableAreas, availableContexts y availableTags. No crees opciones nuevas.",
            "Si un dato admite más de una interpretación, omitilo y explicalo brevemente en ambiguities. dueTime requiere dueDate.",
            "Usá títulos breves como acciones y description sólo para detalles útiles. Máximo 10 tareas.",
            "Devolvé sólo JSON válido con esta forma:",
            '{"tasks":[{"title":"acción","description":"","dueDate":null,"dueTime":null,"priority":0,"areaId":null,"contextId":null,"tagIds":[],"ambiguities":[]}]}'
        ].join("\n");

        this.loading = true;
        this.error = "";
        this.renderDialog();
        try {
            const response = await gateway.aiQuery({
                ...this.app.syncConfig.get(),
                question,
                context: this.buildContext()
            });
            assertAiStructuredResponseComplete(response, { kind: "La propuesta de tareas" });
            const items = parseTaskCaptureProposals(
                response.answer,
                {
                    areas: this.app?.areaService?.getAllAreas?.() || [],
                    contexts: this.app?.contextService?.getAllContexts?.() || [],
                    tags: this.app?.tagService?.getAllTags?.() || []
                }
            );
            this.proposal = {
                provider: response.provider || "",
                model: response.model || "",
                items: items.map(item => ({ ...item, selected: true }))
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

    validateSelectedItems() {
        const selected = this.getSelectedItems();
        if (!selected.length) throw new Error("Seleccioná al menos una tarea para crear.");
        const seen = new Set();
        return selected.map(item => {
            const title = normalizeText(item?.title, MAX_TITLE_LENGTH);
            const description = String(item?.description || "").trim().slice(0, MAX_DESCRIPTION_LENGTH);
            const key = title.toLocaleLowerCase("es");
            if (!title || seen.has(key)) {
                throw new Error("La propuesta contiene una tarea inválida o duplicada.");
            }
            seen.add(key);
            return {
                title,
                description,
                dueDate: item.dueDate || null,
                dueTime: item.dueTime || null,
                priority: item.priority || 0,
                areaId: item.areaId || null,
                contextId: item.contextId || null,
                tagIds: [...(item.tagIds || [])]
            };
        });
    }

    async confirmAndApply() {
        let tasks;
        try {
            tasks = this.validateSelectedItems();
        } catch (error) {
            await Dialog.alert(error.message, { title: "No se pueden crear las tareas" });
            return 0;
        }
        const confirmed = await Dialog.confirmAsync(
            `Se crearán ${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"} en Inbox.`,
            {
                title: "Crear tareas propuestas",
                confirmLabel: "Crear tareas",
                cancelLabel: "Cancelar"
            }
        );
        if (!confirmed) return 0;

        try {
            tasks.forEach(task => this.app.taskService.createTask(task));
            this.proposal = null;
            this.sourceText = "";
            this.error = "";
            this.app.render?.();
            this.renderDialog();
            await Dialog.alert(
                `Se crearon ${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"} en Inbox.`,
                { title: "Tareas creadas" }
            );
            return tasks.length;
        } catch (error) {
            await Dialog.alert(
                error?.message || "No se pudieron crear las tareas propuestas.",
                { title: "Error al crear tareas" }
            );
            return 0;
        }
    }
}
