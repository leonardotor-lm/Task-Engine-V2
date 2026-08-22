import { escapeHtml } from "./escapeHtml.js";
import {
    AI_PROVIDERS,
    DEFAULT_AI_PROVIDER
} from "../infrastructure/AiPreferences.js";

export class AiSettingsController {

    constructor(app, { documentRef = globalThis.document } = {}) {
        this.app = app;
        this.document = documentRef;
        this.status = null;
        this.loading = false;
        this.error = "";
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
        const originalRender = mainView.render.bind(mainView);

        mainView.render = state => {
            originalRender(state);
            this.apply();
        };
    }

    apply() {
        if (!this.app?.settingsDialogOpen) return;

        if (!this.app.settingsSection) {
            this.addMenuEntry();
            return;
        }

        if (this.app.settingsSection !== "ai") return;

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
        const menu = this.document?.querySelector?.(".settingsMenu");
        if (!menu || this.document.getElementById("openAiSettings")) return;

        const button = this.document.createElement("button");
        button.id = "openAiSettings";
        button.type = "button";
        button.textContent = "IA";
        button.addEventListener("click", () => {
            this.status = null;
            this.error = "";
            this.app.settingsSection = "ai";
            this.app.render();
        });

        const applicationButton = menu.querySelector('[data-section="application"]');
        if (applicationButton) menu.insertBefore(button, applicationButton);
        else menu.appendChild(button);
    }

    isEnabled() {
        return Boolean(this.app?.aiPreferences?.isEnabled?.());
    }

    getSelectedProvider() {
        const providerId =
            this.app?.aiPreferences?.getProvider?.() ||
            DEFAULT_AI_PROVIDER;

        return AI_PROVIDERS.find(
            provider => provider.id === providerId
        ) || AI_PROVIDERS[0];
    }

    getSelectedStatus() {
        const provider = this.getSelectedProvider();
        const providerStatus =
            this.status?.providers?.[provider.id];

        if (providerStatus) {
            return providerStatus;
        }

        if (
            this.status &&
            !this.status.providers &&
            (
                Object.prototype.hasOwnProperty.call(
                    this.status,
                    "configured"
                ) ||
                Object.prototype.hasOwnProperty.call(
                    this.status,
                    "connected"
                )
            )
        ) {
            return this.status;
        }

        return null;
    }

    renderPanel() {
        const title = this.document?.getElementById?.("settingsTitle");
        const body = this.document?.querySelector?.(".settingsDialogBody");
        if (!body) return;
        if (title) title.textContent = "Inteligencia artificial";

        body.innerHTML = this.getPanelHtml();

        this.document.getElementById("aiEnabled")?.addEventListener("change", event => {
            const enabled = this.app.aiPreferences.setEnabled(event.target.checked);
            this.status = null;
            this.error = "";
            if (enabled) this.refresh(false);
            else this.renderPanel();
        });

        this.document.getElementById("aiProvider")?.addEventListener("change", event => {
            this.app.aiPreferences.setProvider(event.target.value);
            this.error = "";
            this.renderPanel();
        });

        this.document.getElementById("aiModel")?.addEventListener("change", event => {
            this.app.aiPreferences.setModel(event.target.value);
            this.renderPanel();
        });

        this.document.getElementById("verifyAiConnection")?.addEventListener("click", () => this.refresh(true));
    }

    getPanelHtml() {
        const enabled = this.isEnabled();
        const selectedStatus = this.getSelectedStatus();
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
            } else if (selectedStatus?.connected === true) {
                statusClass = "configured";
                statusText = "Conectada";
            } else if (selectedStatus?.configured) {
                statusClass = "pending";
                statusText = "Configurada";
            } else if (this.status) {
                statusText = "Sin configurar";
            }
        }

        return `
            <section class="settingsToolPanel aiTools">
                <header class="settingsToolHeader">
                    <h3>Asistencia con IA</h3>
                    <span class="syncStatus ${statusClass}" role="status">${statusText}</span>
                </header>

                <label class="settingsToggleControl" for="aiEnabled">
                    <input id="aiEnabled" type="checkbox" ${enabled ? "checked" : ""}>
                    <span>Usar asistencia con IA</span>
                </label>

                <p class="settingsHint">La IA es opcional. Si está desactivada, Task Engine no envía datos a ningún proveedor de inteligencia artificial.</p>

                ${enabled ? this.getEnabledPanelHtml(selectedStatus) : `<p class="settingsHint">Task Engine continúa funcionando normalmente sin IA.</p>`}
            </section>`;
    }

    getEnabledPanelHtml(status) {
        const provider = this.getSelectedProvider();
        const selectedModel =
            this.app?.aiPreferences?.getModel?.() ||
            provider.defaultModel;

        const providerOptions = AI_PROVIDERS.map(item => `
            <option value="${escapeHtml(item.id)}" ${item.id === provider.id ? "selected" : ""}>
                ${escapeHtml(item.label)}
            </option>`).join("");

        const modelOptions = provider.models.map(model => `
            <option value="${escapeHtml(model.id)}" ${model.id === selectedModel ? "selected" : ""}>
                ${escapeHtml(model.label)} — ${escapeHtml(model.id)}
            </option>`).join("");
        const selected = provider.models.find(model => model.id === selectedModel);
        const propertyName = provider.id === "groq"
            ? "TASK_ENGINE_GROQ_API_KEY"
            : "TASK_ENGINE_GEMINI_API_KEY";

        return `
            <label for="aiProvider">Proveedor</label>
            <select id="aiProvider">${providerOptions}</select>
            <p class="settingsHint">${escapeHtml(provider.description)}</p>

            <label for="aiModel">Modelo para consultas</label>
            <select id="aiModel">${modelOptions}</select>
            <p class="settingsHint">${escapeHtml(selected?.description || "")}</p>

            <p class="settingsHint">La selección se guarda en este dispositivo. Las claves permanecen en Apps Script y nunca se envían al navegador.</p>

            ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}

            ${status && !status.configured ? `
                <div class="notionSetupGuide">
                    <p>Para usar ${escapeHtml(provider.label)}, configurá esta propiedad del proyecto de Apps Script:</p>
                    <ul><li><code>${propertyName}</code></li></ul>
                </div>` : ""}

            <button id="verifyAiConnection" type="button" class="primaryAction" ${this.loading ? "disabled" : ""}>
                ${this.loading ? "Comprobando…" : "Verificar conexión"}
            </button>`;
    }

    async refresh(validateRemote) {
        if (this.loading || !this.isEnabled()) return null;

        if (!this.app?.syncConfig?.isConfigured?.()) {
            this.error = "Configurá primero la conexión de sincronización con Apps Script.";
            this.status = null;
            this.renderPanel();
            return null;
        }

        const gateway = this.app.syncEngine?.gateway;
        if (!gateway?.aiStatus) {
            this.error = "La instalación actual de Apps Script todavía no admite IA.";
            this.renderPanel();
            return null;
        }

        const connection = this.app.syncConfig.get();
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
            this.error = error?.message || "No se pudo comprobar la conexión con el proveedor de IA.";
            return null;
        } finally {
            this.loading = false;
            this.renderPanel();
        }
    }
}
