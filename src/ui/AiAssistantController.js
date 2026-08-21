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
        this.wrapRender();
        this.apply();
    }

    wrapRender() {
        const mainView = this.app?.mainView;

        if (!mainView?.render) return;

        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {
            originalRender(state);
            this.apply();
        };
    }

    apply() {
        this.addSidebarEntry();
        this.ensureDialog();
    }

    addSidebarEntry() {
        if (
            !this.document?.querySelectorAll ||
            this.document.getElementById(
                "openAiAssistant"
            )
        ) {
            return;
        }

        const planningLabel = [
            ...this.document.querySelectorAll(
                ".sidebarSectionLabel"
            )
        ].find(element =>
            element.textContent?.trim() ===
                "Planificación"
        );

        if (!planningLabel) return;

        const button =
            this.document.createElement("button");

        button.id = "openAiAssistant";
        button.type = "button";
        button.className = "sidebarButton";
        button.textContent = "Asistente IA";
        button.setAttribute(
            "aria-haspopup",
            "dialog"
        );

        button.addEventListener(
            "click",
            () => this.open()
        );

        planningLabel.insertAdjacentElement(
            "afterend",
            button
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
        dialog.className = "settingsDialog aiAssistantDialog";
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

                <form id="aiAssistantQueryForm">
                    <label for="aiAssistantQuestion">
                        Pregunta
                    </label>
                    <textarea
                        id="aiAssistantQuestion"
                        rows="4"
                        maxlength="1000"
                        placeholder="Por ejemplo: ¿qué tareas vencidas tengo?"
                        ${this.queryLoading ? "disabled" : ""}>${escapeHtml(this.question)}</textarea>

                    <button
                        type="submit"
                        class="primaryAction"
                        ${this.queryLoading ? "disabled" : ""}>
                        ${this.queryLoading
                            ? "Analizando…"
                            : "Preguntar"}
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
                        <div class="settingsToolPanel aiReadonlyAnswer" role="status">
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
                "Escribí una pregunta antes de consultar.";
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
