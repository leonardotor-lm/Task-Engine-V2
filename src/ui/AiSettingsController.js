import {
    buildAiTaskContext
} from "../core/AiTaskContext.js";
import { escapeHtml } from "./escapeHtml.js";

function formatAnswer(answer) {
    return escapeHtml(answer || "")
        .replace(/\n/g, "<br>");
}

export class AiSettingsController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {
        this.app = app;
        this.document = documentRef;
        this.status = null;
        this.loading = false;
        this.error = "";
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
        if (!this.app?.settingsDialogOpen) {
            return;
        }

        if (!this.app.settingsSection) {
            this.addMenuEntry();
            return;
        }

        if (this.app.settingsSection !== "ai") {
            return;
        }

        this.renderPanel();

        if (
            this.isEnabled() &&
            !this.status &&
            !this.loading &&
            !this.error
        ) {
            this.refresh(false);
        }
    }

    addMenuEntry() {
        const menu = this.document
            ?.querySelector?.(".settingsMenu");

        if (
            !menu ||
            this.document.getElementById(
                "openAiSettings"
            )
        ) {
            return;
        }

        const button =
            this.document.createElement("button");

        button.id = "openAiSettings";
        button.type = "button";
        button.textContent = "IA";

        button.addEventListener("click", () => {
            this.status = null;
            this.error = "";
            this.app.settingsSection = "ai";
            this.app.render();
        });

        const applicationButton =
            menu.querySelector(
                '[data-section="application"]'
            );

        if (applicationButton) {
            menu.insertBefore(
                button,
                applicationButton
            );
        } else {
            menu.appendChild(button);
        }
    }

    isEnabled() {
        return Boolean(
            this.app?.aiPreferences?.isEnabled?.()
        );
    }

    renderPanel() {
        const title = this.document
            ?.getElementById?.("settingsTitle");
        const body = this.document
            ?.querySelector?.(
                ".settingsDialogBody"
            );

        if (!body) return;

        if (title) {
            title.textContent = "Inteligencia artificial";
        }

        body.innerHTML = this.getPanelHtml();

        this.document.getElementById(
            "aiEnabled"
        )?.addEventListener(
            "change",
            event => {
                const enabled =
                    this.app.aiPreferences
                        .setEnabled(
                            event.target.checked
                        );

                this.status = null;
                this.error = "";
                this.queryError = "";
                this.answer = "";

                if (enabled) {
                    this.refresh(false);
                } else {
                    this.renderPanel();
                }
            }
        );

        this.document.getElementById(
            "verifyAiConnection"
        )?.addEventListener(
            "click",
            () => this.refresh(true)
        );

        this.document.getElementById(
            "aiQueryForm"
        )?.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                const input =
                    this.document.getElementById(
                        "aiQuestion"
                    );
                this.ask(input?.value || "");
            }
        );
    }

    getPanelHtml() {
        const enabled = this.isEnabled();
        const status = this.status;

        let statusClass = "disconnected";
        let statusText = "Desactivada";

        if (enabled) {
            statusText = "Sin comprobar";

            if (this.loading) {
                statusClass = "syncing";
                statusText = "Comprobando…";
            } else if (this.error) {
                statusClass = "error";
                statusText = "Error";
            } else if (status?.connected === true) {
                statusClass = "configured";
                statusText = "Conectada";
            } else if (status?.configured) {
                statusClass = "pending";
                statusText = "Configurada";
            } else if (status) {
                statusText = "Sin configurar";
            }
        }

        return `
            <section class="settingsToolPanel aiTools">

                <header class="settingsToolHeader">
                    <h3>Asistencia con IA</h3>
                    <span
                        class="syncStatus ${statusClass}"
                        role="status">
                        ${statusText}
                    </span>
                </header>

                <label class="settingsToggleControl" for="aiEnabled">
                    <input
                        id="aiEnabled"
                        type="checkbox"
                        ${enabled ? "checked" : ""}>
                    <span>Usar asistencia con IA</span>
                </label>

                <p class="settingsHint">
                    La IA es opcional. Si está desactivada, Task Engine no envía datos a ningún proveedor de inteligencia artificial.
                </p>

                ${enabled
                    ? this.getEnabledPanelHtml(status)
                    : `
                        <p class="settingsHint">
                            Task Engine continúa funcionando normalmente sin IA.
                        </p>
                    `}

            </section>
        `;
    }

    getEnabledPanelHtml(status) {
        const queryAvailable =
            status?.configured === true;

        return `
            <div class="aiConnectionDetails">
                <p>
                    <strong>Proveedor:</strong>
                    Gemini
                </p>
                <p>
                    <strong>Modelo:</strong>
                    ${escapeHtml(
                        status?.model ||
                        "gemini-3.7-flash"
                    )}
                </p>
            </div>

            <p class="settingsHint">
                La clave de Gemini se guarda en las propiedades del proyecto de Apps Script y nunca se envía al navegador.
            </p>

            ${this.error
                ? `
                    <p class="syncErrorHint" role="alert">
                        ${escapeHtml(this.error)}
                    </p>
                `
                : ""}

            ${status && !status.configured
                ? `
                    <div class="notionSetupGuide">
                        <p>
                            Configurá esta propiedad del proyecto de Apps Script:
                        </p>
                        <ul>
                            <li>
                                <code>TASK_ENGINE_GEMINI_API_KEY</code>
                            </li>
                        </ul>
                        <p class="settingsHint">
                            Opcionalmente podés definir <code>TASK_ENGINE_GEMINI_MODEL</code> para elegir otro modelo compatible.
                        </p>
                    </div>
                `
                : ""}

            <button
                id="verifyAiConnection"
                type="button"
                class="primaryAction"
                ${this.loading ? "disabled" : ""}>
                ${this.loading
                    ? "Comprobando…"
                    : "Verificar conexión"}
            </button>

            ${queryAvailable
                ? this.getQueryPanelHtml()
                : ""}
        `;
    }

    getQueryPanelHtml() {
        return `
            <div class="aiReadonlyQuery">
                <h3>Consultar tareas</h3>

                <p class="settingsHint">
                    Esta primera versión es de sólo lectura. Se envían títulos y datos operativos; no se envían descripciones, adjuntos ni notas de Notion.
                </p>

                <form id="aiQueryForm">
                    <label for="aiQuestion">
                        Pregunta
                    </label>
                    <textarea
                        id="aiQuestion"
                        rows="3"
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
            </div>
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
            this.renderPanel();
            return null;
        }

        if (!this.app?.syncConfig?.isConfigured?.()) {
            this.queryError =
                "Configurá primero la conexión con Apps Script.";
            this.renderPanel();
            return null;
        }

        const gateway =
            this.app.syncEngine?.gateway;

        if (!gateway?.aiQuery) {
            this.queryError =
                "La instalación actual de Apps Script todavía no admite consultas de IA.";
            this.renderPanel();
            return null;
        }

        this.question = normalizedQuestion;
        this.answer = "";
        this.queryError = "";
        this.queryLoading = true;
        this.renderPanel();

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
                error?.message ||
                "No se pudo completar la consulta a Gemini.";

            return null;
        } finally {
            this.queryLoading = false;
            this.renderPanel();
        }
    }

    async refresh(validateRemote) {
        if (this.loading || !this.isEnabled()) {
            return null;
        }

        if (!this.app?.syncConfig?.isConfigured?.()) {
            this.error =
                "Configurá primero la conexión de sincronización con Apps Script.";
            this.status = null;
            this.renderPanel();
            return null;
        }

        const gateway =
            this.app.syncEngine?.gateway;

        if (!gateway?.aiStatus) {
            this.error =
                "La instalación actual de Apps Script todavía no admite IA.";
            this.renderPanel();
            return null;
        }

        const connection =
            this.app.syncConfig.get();

        this.loading = true;
        this.error = "";
        this.renderPanel();

        try {
            this.status = await gateway.aiStatus({
                ...connection,
                validateRemote
            });

            return this.status;
        } catch (error) {
            this.status = null;
            this.error =
                error?.message ||
                "No se pudo comprobar la conexión con Gemini.";

            return null;
        } finally {
            this.loading = false;
            this.renderPanel();
        }
    }

}
