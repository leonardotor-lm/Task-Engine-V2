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

function normalizeText(value, maxLength) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

export function parseTaskCaptureProposals(answer) {
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

    return items.slice(0, MAX_TASKS).map(item => {
        const title = normalizeText(item?.title, MAX_TITLE_LENGTH);
        const description = String(item?.description || "")
            .trim()
            .slice(0, MAX_DESCRIPTION_LENGTH);
        const key = title.toLocaleLowerCase("es");
        if (!title || seen.has(key)) return null;
        seen.add(key);
        return { title, description };
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
        button.textContent = "Convertir texto en tareas";

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
                .aiTaskCaptureActions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="aiTaskCaptureTitle">Convertir texto en tareas</h2>
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
                <p>Pegá una nota, párrafo o lista informal. La IA propondrá tareas concretas para que las revises antes de crearlas.</p>
                <label for="aiTaskCaptureSource"><strong>Texto a procesar</strong></label>
                <textarea id="aiTaskCaptureSource" class="aiTaskCaptureInput" maxlength="${MAX_SOURCE_LENGTH}" placeholder="Ej.: Tengo que llamar al plomero, comprar los materiales para la clase del martes y revisar las evaluaciones de 3.º...">${escapeHtml(this.sourceText)}</textarea>
                <p class="settingsHint">Las tareas se crearán en Inbox. La IA no asignará áreas, etiquetas, fechas ni prioridades.</p>
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
                </div>
            </label>`).join("");
        return `<div class="aiTaskCaptureList">${html}</div>
            <p class="settingsHint">${this.getSelectedItems().length} de ${items.length} propuestas seleccionadas.</p>`;
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
            sourceText: this.sourceText.trim(),
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
            "Convertí el texto libre recibido en una lista conservadora de tareas concretas y accionables.",
            "No inventes acciones que no estén expresadas o claramente implicadas por el texto.",
            "No agregues fechas, prioridades, áreas, contextos, etiquetas, personas, compromisos ni datos que no estén en el texto.",
            "Usá títulos breves redactados como acciones. Usá description sólo para conservar información útil del texto que no entre naturalmente en el título.",
            `Proponé como máximo ${MAX_TASKS} tareas. Si no hay acciones concretas, devolvé una lista vacía.`,
            "Devolvé exclusivamente JSON válido, sin Markdown ni texto adicional, con esta forma exacta:",
            '{"tasks":[{"title":"acción breve","description":"detalle opcional"}]}'
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
            const items = parseTaskCaptureProposals(response.answer);
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
            return { title, description };
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
