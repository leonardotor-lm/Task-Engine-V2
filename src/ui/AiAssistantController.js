import {
    buildAiTaskContext
} from "../core/AiTaskContext.js";
import { escapeHtml } from "./escapeHtml.js";

const MAX_CHAT_HISTORY_MESSAGES = 6;
const MAX_CHAT_MESSAGE_CHARS = 1200;

function formatAnswer(answer) {
    return escapeHtml(answer || "")
        .replace(/\n/g, "<br>");
}

function normalizeHistoryMessage(message) {
    const role = message?.role === "assistant"
        ? "assistant"
        : "user";
    const content = String(message?.content || "")
        .trim()
        .slice(0, MAX_CHAT_MESSAGE_CHARS);

    return content ? { role, content } : null;
}

export function normalizeAiQueryError(error) {
    const message = String(
        error?.message || error || ""
    ).trim();

    if (
        /high demand|try again later|resource exhausted|overloaded|temporarily unavailable/i
            .test(message)
    ) {
        return "El proveedor de IA está saturado en este momento. Intentá nuevamente en unos minutos o elegí otro proveedor.";
    }

    if (/rate limit|too many requests/i.test(message)) {
        return "Se alcanzó temporalmente el límite del proveedor de IA. Intentá nuevamente más tarde o elegí otro proveedor.";
    }

    return message ||
        "No se pudo completar la consulta a la IA.";
}

export class AiAssistantController {

    constructor(app, { documentRef = globalThis.document } = {}) {
        this.app = app;
        this.document = documentRef;
        this.queryLoading = false;
        this.queryError = "";
        this.messages = [];
        this.draft = "";
        this.lastTaskCount = null;
        this.started = false;
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
            if (html.includes('id="openAiAssistant"')) return html;

            const marker = `
                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>`;

            if (!html.includes(marker)) return html;

            const entry = `

                    <button
                        id="openAiAssistant"
                        type="button"
                        class="sidebarButton"
                        aria-haspopup="dialog">
                        Asistente IA
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
        const entry = this.document?.getElementById?.("openAiAssistant");
        if (!entry || entry.dataset.aiBound) return;
        entry.dataset.aiBound = "true";
        entry.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (!this.document?.body || this.document.getElementById("aiAssistantDialog")) return;
        const dialog = this.document.createElement("dialog");
        dialog.id = "aiAssistantDialog";
        dialog.className = "settingsDialog aiAssistantDialog";
        dialog.setAttribute("aria-labelledby", "aiAssistantTitle");
        this.document.body.appendChild(dialog);
    }

    isEnabled() {
        return Boolean(this.app?.aiPreferences?.isEnabled?.());
    }

    open() {
        this.ensureDialog();
        this.renderDialog();
        const dialog = this.document.getElementById("aiAssistantDialog");
        if (dialog && !dialog.open && typeof dialog.showModal === "function") dialog.showModal();
        this.focusComposer();
    }

    close() {
        const dialog = this.document.getElementById("aiAssistantDialog");
        if (dialog?.open && typeof dialog.close === "function") dialog.close();
    }

    resetConversation() {
        if (this.queryLoading) return;
        this.messages = [];
        this.draft = "";
        this.queryError = "";
        this.lastTaskCount = null;
        this.renderDialog();
        this.focusComposer();
    }

    focusComposer() {
        this.document.getElementById("aiAssistantQuestion")?.focus?.();
    }

    renderDialog() {
        const dialog = this.document.getElementById("aiAssistantDialog");
        if (!dialog) return;

        dialog.innerHTML = `
            <style>
                .aiChatTranscript { display:flex; flex-direction:column; gap:10px; max-height:45vh; overflow:auto; padding:2px 2px 8px; }
                .aiChatMessage { max-width:88%; padding:10px 12px; border:1px solid var(--border-color, #d8d8d8); border-radius:8px; background:var(--surface-color, #fff); }
                .aiChatMessage.user { align-self:flex-end; }
                .aiChatMessage.assistant { align-self:flex-start; }
                .aiChatMessageLabel { display:block; font-size:.78rem; margin-bottom:4px; opacity:.7; }
                .aiAssistantQueryForm { display:flex; flex-direction:column; align-items:stretch; gap:10px; margin-top:12px; }
                .aiAssistantQueryForm label { display:block; margin:0; }
                .aiAssistantQueryForm textarea { display:block; width:100%; box-sizing:border-box; margin:0; resize:vertical; }
                .aiAssistantQuerySubmit { align-self:flex-start; width:auto; min-width:0; padding:7px 14px; margin:0; }
                .aiChatFooterActions { display:flex; gap:8px; justify-content:space-between; width:100%; }
                @media (min-width: 761px) {
                    .aiAssistantDialog { width:min(720px, calc(100vw - 48px)); }
                    .aiAssistantQueryForm textarea { min-height:96px; }
                }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="aiAssistantTitle">Asistente IA</h2>
                <button id="closeAiAssistant" type="button" class="iconButton" aria-label="Cerrar asistente IA" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">${this.getBodyHtml()}</div>
            <div class="settingsDialogFooter">
                <div class="aiChatFooterActions">
                    <button id="newAiConversation" type="button" class="tertiaryAction" ${this.queryLoading ? "disabled" : ""}>Nueva conversación</button>
                    <button id="cancelAiAssistant" type="button" class="tertiaryAction">Cerrar</button>
                </div>
            </div>`;

        this.bindDialogEvents();

        const transcript = this.document.getElementById("aiChatTranscript");
        if (transcript) transcript.scrollTop = transcript.scrollHeight;
    }

    bindDialogEvents() {
        this.document.getElementById("closeAiAssistant")?.addEventListener("click", () => this.close());
        this.document.getElementById("cancelAiAssistant")?.addEventListener("click", () => this.close());
        this.document.getElementById("newAiConversation")?.addEventListener("click", () => this.resetConversation());
        this.document.getElementById("aiAssistantQuestion")?.addEventListener("input", event => {
            this.draft = event.target.value;
        });
        this.document.getElementById("aiAssistantQueryForm")?.addEventListener("submit", event => {
            event.preventDefault();
            const input = this.document.getElementById("aiAssistantQuestion");
            this.ask(input?.value || "");
        });
        this.document.getElementById("openAiConfiguration")?.addEventListener("click", () => {
            this.close();
            this.app.settingsDialogOpen = true;
            this.app.settingsSection = "ai";
            this.app.render();
        });
    }

    getBodyHtml() {
        if (!this.isEnabled()) {
            return `
                <section class="settingsToolPanel">
                    <p>La asistencia con IA está desactivada.</p>
                    <p class="settingsHint">Podés activarla desde Configuración → IA. Mientras esté desactivada no se envían datos a ningún proveedor de IA.</p>
                    <button id="openAiConfiguration" type="button" class="primaryAction">Abrir configuración de IA</button>
                </section>`;
        }

        return `
            <section class="settingsToolPanel aiReadonlyQuery">
                <p class="settingsHint">Chat de sólo lectura. Task Engine selecciona localmente las tareas relevantes; no se envían descripciones, adjuntos ni notas de Notion.</p>
                ${this.getTranscriptHtml()}
                ${this.queryError ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.queryError)}</p>` : ""}
                <form id="aiAssistantQueryForm" class="aiAssistantQueryForm">
                    <label for="aiAssistantQuestion">Consulta</label>
                    <textarea id="aiAssistantQuestion" rows="3" maxlength="1000" placeholder="Escribí un mensaje…" ${this.queryLoading ? "disabled" : ""}>${escapeHtml(this.draft)}</textarea>
                    <button type="submit" class="secondaryAction aiAssistantQuerySubmit" ${this.queryLoading ? "disabled" : ""}>${this.queryLoading ? "Analizando…" : "Enviar"}</button>
                </form>
            </section>`;
    }

    getTranscriptHtml() {
        if (!this.messages.length) {
            return `<div id="aiChatTranscript" class="aiChatTranscript"><p class="settingsHint">Podés hacer una consulta y después continuar con preguntas de seguimiento.</p></div>`;
        }

        const html = this.messages.map(message => {
            const roleClass = message.role === "assistant" ? "assistant" : "user";
            const label = message.role === "assistant" ? "Asistente" : "Vos";
            const taskHint = message.role === "assistant" && Number.isInteger(message.taskCount)
                ? `<span class="settingsHint">Analizadas: ${message.taskCount} tareas relevantes.</span>`
                : "";

            return `<div class="aiChatMessage ${roleClass}"><span class="aiChatMessageLabel">${label}</span><div>${formatAnswer(message.content)}</div>${taskHint}</div>`;
        }).join("");

        return `<div id="aiChatTranscript" class="aiChatTranscript" role="log" aria-live="polite">${html}</div>`;
    }

    getChatHistory() {
        return this.messages
            .slice(-MAX_CHAT_HISTORY_MESSAGES)
            .map(normalizeHistoryMessage)
            .filter(Boolean);
    }

    buildSelectionQuestion(question) {
        const recentUserMessages = this.messages
            .filter(message => message.role === "user")
            .slice(-2)
            .map(message => message.content);

        return [...recentUserMessages, question]
            .filter(Boolean)
            .join("\n");
    }

    buildContext(question = "") {
        return {
            ...buildAiTaskContext({
                tasks: this.app.taskService?.repository?.getAll?.() || [],
                areas: this.app.areaService?.getAllAreas?.() || [],
                contexts: this.app.contextService?.getAllContexts?.() || [],
                tags: this.app.tagService?.getAllTags?.() || [],
                question: this.buildSelectionQuestion(question)
            }),
            chatHistory: this.getChatHistory(),
            aiProvider:
                this.app?.aiPreferences?.getProvider?.() ||
                "groq",
            aiModel:
                this.app?.aiPreferences?.getModel?.() ||
                "openai/gpt-oss-20b"
        };
    }

    async ask(question) {
        if (this.queryLoading || !this.isEnabled()) return null;
        const normalizedQuestion = String(question || "").trim();

        if (!normalizedQuestion) {
            this.queryError = "Escribí una consulta antes de continuar.";
            this.renderDialog();
            return null;
        }

        if (!this.app?.syncConfig?.isConfigured?.()) {
            this.queryError = "Configurá primero la conexión con Apps Script.";
            this.renderDialog();
            return null;
        }

        const gateway = this.app.syncEngine?.gateway;
        if (!gateway?.aiQuery) {
            this.queryError = "La instalación actual de Apps Script todavía no admite consultas de IA.";
            this.renderDialog();
            return null;
        }

        const context = this.buildContext(normalizedQuestion);
        this.messages.push({
            role: "user",
            content: normalizedQuestion
        });
        this.draft = "";
        this.queryError = "";
        this.queryLoading = true;
        this.renderDialog();

        try {
            const response = await gateway.aiQuery({
                ...this.app.syncConfig.get(),
                question: normalizedQuestion,
                context
            });
            const answer = response.answer || "";
            this.lastTaskCount = response.taskCount ?? null;
            this.messages.push({
                role: "assistant",
                content: answer,
                taskCount: this.lastTaskCount
            });
            return response;
        } catch (error) {
            this.queryError = normalizeAiQueryError(error);
            return null;
        } finally {
            this.queryLoading = false;
            this.renderDialog();
            this.focusComposer();
        }
    }
}
