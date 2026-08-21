import {
    buildAiTaskContext
} from "../core/AiTaskContext.js";
import { escapeHtml } from "./escapeHtml.js";

function formatAnswer(answer) {
    return escapeHtml(answer || "")
        .replace(/\n/g, "<br>");
}

export function normalizeAiQueryError(error) {
    const message = String(
        error?.message || error || ""
    ).trim();

    if (
        /high demand|try again later|resource exhausted|overloaded|temporarily unavailable/i
            .test(message)
    ) {
        return "Gemini está saturado en este momento. Intentá nuevamente en unos minutos.";
    }

    return message ||
        "No se pudo completar la consulta a Gemini.";
}

export class AiAssistantController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {
        this.app = app;
        this.document = documentRef;
        this.queryLoading = false;
        this.queryError = "";
        this.question = "";
        this.answer = "";
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

        const originalRender =
            sidebar.render.bind(sidebar);

        sidebar.render = (...args) => {
            const html = originalRender(...args);

            if (
                html.includes(
                    'id="openAiAssistant"'
                )
            ) {
                return html;
            }

            const marker = `
                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>`;

            if (!html.includes(marker)) {
                return html;
            }

            const entry = `

                    <button
                        id="openAiAssistant"
                        type="button"
                        class="sidebarButton"
                        aria-haspopup="dialog">
                        Asistente IA
                    </button>`;

            return html.replace(
                marker,
                `${marker}${entry}`
            );
        };
    }

    wrapAppRender() {
        if (!this.app?.render) return;

        const originalRender =
            this.app.render.bind(this.app);

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
        const entry = this.document
            ?.getElementById?.("openAiAssistant");

        if (!entry || entry.dataset.aiBound) {
            return;
        }

        entry.dataset.aiBound = "true";
        entry.addEventListener(
            "click",
            () => this.open()
        );
    }

    ensureDialog() {
        if (
            !this.document?.body ||
            this.document.getElementById(
                "aiAssistantDialog"
            )
        ) {
            return;
        }

        const dialog =
            this.document.createElement("dialog");

        dialog.id = "aiAssistantDialog";
        dialog.className =
            "settingsDialog aiAssistantDialog";
        dialog.setAttribute(
            "aria-labelledby",
            "aiAssistantTitle"
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

        const dialog =
            this.document.getElementById(
                "aiAssistantDialog"
            );

        if (
            dialog &&
            !dialog.open &&
            typeof dialog.showModal === "function"
        ) {
            dialog.showModal();
        }

        this.document.getElementById(
            "aiAssistantQuestion"
        )?.focus?.();
    }

    close() {
        const dialog =
            this.document.getElementById(
                "aiAssistantDialog"
            );

        if (
            dialog?.open &&
            typeof dialog.close === "function"
        ) {
            dialog.close();
        }
    }

    renderDialog() {
        const dialog =
            this.document.getElementById(
                "aiAssistantDialog"
            );

        if (!dialog) return;

        dialog.innerHTML = `
            <style>
                .aiAssistantQueryForm {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 10px;
                }

                .aiAssistantQueryForm label {
                    display: block;
                    margin: 0;
                }

                .aiAssistantQueryForm textarea {
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                    margin: 0;
                    resize: vertical;
                }

                .aiAssistantQuerySubmit {
                    align-self: flex-start;
                    width: auto;
                    min-width: 0;
                    padding: 7px 14px;
                    margin: 0;
                }

                @media (min-width: 761px) {
                    .aiAssistantDialog {
                        width: min(680px, calc(100vw - 48px));
                    }

                    .aiAssistantQueryForm textarea {
                        min-height: 180px;
                    }
                }
            </style>

            <div class="settingsDialogHeader">
                <h2 id="aiAssistantTitle">
                    Asistente IA
                </h2>

                <button
                    id="closeAiAssistant"
                    type="button"
                    class="iconButton"
                    aria-label="Cerrar asistente IA"
                    title="Cerrar">
                    ×
                </button>
            </div>

            <div class="settingsDialogBody">
                ${this.getBodyHtml()}
            </div>

            <div class="settingsDialogFooter">
                <button
                    id="cancelAiAssistant"
                    type="button"
                    class="tertiaryAction">
                    Cerrar
                </button>
            </div>
        `;

        this.document.getElementById(
            "closeAiAssistant"
        )?.addEventListener(
            "click",
            () => this.close()
        );

        this.document.getElementById(
            "cancelAiAssistant"
        )?.addEventListener(
            "click",
            () => this.close()
        );

        this.document.getElementById(
            "aiAssistantQueryForm"
        )?.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                const input =
                    this.document.getElementById(
                        "aiAssistantQuestion"
                    );
                this.ask(input?.value || "");
            }
        );

        this.document.getElementById(
            "openAiConfiguration"
        )?.addEventListener(
            "click",
            () => {
                this.close();
                this.app.settingsDialogOpen = true;
                this.app.settingsSection = "ai";
                this.app.render();
            }
        );
    }

    getBodyHtml() {
        if (!this.isEnabled()) {
            return `
                <section class="settingsToolPanel">
                    <p>
                        La asistencia con IA está desactivada.
                    </p>
                    <p class="settingsHint">
                        Podés activarla desde Configuración → IA. Mientras esté desactivada no se envían datos a Gemini.
                    </p>
                    <button
                        id="openAiConfiguration"
                        type="button"
                        class="primaryAction">
                        Abrir configuración de IA
                    </button>
                </section>
            `;
        }

        return `
            <section class="settingsToolPanel aiReadonlyQuery">
                <p class="settingsHint">
                    Consulta de sólo lectura. Se envían títulos y datos operativos; no se envían descripciones, adjuntos ni notas de Notion.
                </p>

                <form
                    id="aiAssistantQueryForm"
                    class="aiAssistantQueryForm">
                    <label for="aiAssistantQuestion">
                        Consulta
                    </label>
                    <textarea
                        id="aiAssistantQuestion"
                        rows="4"
                        maxlength="1000"
                        placeholder="Por ejemplo: ¿qué tareas vencidas tengo?"
                        ${this.queryLoading ? "disabled" : ""}>${escapeHtml(this.question)}</textarea>

                    <button
                        type="submit"
                        class="secondaryAction aiAssistantQuerySubmit"
                        ${this.queryLoading ? "disabled" : ""}>
                        ${this.queryLoading
                            ? "Analizando…"
                            : "Consultar"}
                    </button>
                </form>

                ${this.queryError
                    ? `
                        <p class="syncErrorHint" role="alert">
                            ${escapeHtml(this.queryError)}
                        </p>
                    `
                    : ""}

                ${this.answer
                    ? `
                        <div
                            class="settingsToolPanel aiReadonlyAnswer"
                            role="status">
                            <h3>Respuesta</h3>
                            <p>${formatAnswer(this.answer)}</p>
                            <p class="settingsHint">
                                Analizadas: ${Number(this.lastTaskCount ?? 0)} tareas.
                            </p>
                        </div>
                    `
                    : ""}
            </section>
        `;
    }

    buildContext() {
        return buildAiTaskContext({
            tasks:
                this.app.taskService
                    ?.repository?.getAll?.() || [],
            areas:
                this.app.areaService
                    ?.getAllAreas?.() || [],
            contexts:
                this.app.contextService
                    ?.getAllContexts?.() || [],
            tags:
                this.app.tagService
                    ?.getAllTags?.() || []
        });
    }

    async ask(question) {
        if (
            this.queryLoading ||
            !this.isEnabled()
        ) {
            return null;
        }

        const normalizedQuestion =
            String(question || "").trim();

        if (!normalizedQuestion) {
            this.queryError =
                "Escribí una consulta antes de continuar.";
            this.renderDialog();
            return null;
        }

        if (!this.app?.syncConfig?.isConfigured?.()) {
            this.queryError =
                "Configurá primero la conexión con Apps Script.";
            this.renderDialog();
            return null;
        }

        const gateway =
            this.app.syncEngine?.gateway;

        if (!gateway?.aiQuery) {
            this.queryError =
                "La instalación actual de Apps Script todavía no admite consultas de IA.";
            this.renderDialog();
            return null;
        }

        this.question = normalizedQuestion;
        this.answer = "";
        this.queryError = "";
        this.queryLoading = true;
        this.renderDialog();

        try {
            const response = await gateway.aiQuery({
                ...this.app.syncConfig.get(),
                question: normalizedQuestion,
                context: this.buildContext()
            });

            this.answer = response.answer || "";
            this.lastTaskCount =
                response.taskCount ?? null;

            return response;
        } catch (error) {
            this.queryError =
                normalizeAiQueryError(error);

            return null;
        } finally {
            this.queryLoading = false;
            this.renderDialog();
        }
    }

}
