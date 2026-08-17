import { escapeHtml } from "./escapeHtml.js";

export class NotionSettingsController {

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

        if (this.app.settingsSection !== "notion") {
            return;
        }

        this.renderPanel();

        if (
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
                "openNotionSettings"
            )
        ) {
            return;
        }

        const button =
            this.document.createElement("button");

        button.id = "openNotionSettings";
        button.type = "button";
        button.textContent = "Notion";

        button.addEventListener("click", () => {

            this.status = null;
            this.error = "";
            this.app.settingsSection = "notion";
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

    renderPanel() {

        const title = this.document
            ?.getElementById?.("settingsTitle");
        const body = this.document
            ?.querySelector?.(
                ".settingsDialogBody"
            );

        if (!body) return;

        if (title) {
            title.textContent = "Notion";
        }

        body.innerHTML = this.getPanelHtml();

        this.document.getElementById(
            "verifyNotionConnection"
        )?.addEventListener(
            "click",
            () => this.refresh(true)
        );

    }

    getPanelHtml() {

        const status = this.status;

        let statusClass = "disconnected";
        let statusText = "Sin comprobar";

        if (this.loading) {
            statusClass = "syncing";
            statusText = "Comprobando…";
        } else if (this.error) {
            statusClass = "error";
            statusText = "Error";
        } else if (status?.connected === true) {
            statusClass = "configured";
            statusText = "Conectado";
        } else if (status?.configured) {
            statusClass = "pending";
            statusText = "Configurado";
        } else if (status) {
            statusText = "Sin configurar";
        }

        return `
            <section class="settingsToolPanel notionTools">

                <header class="settingsToolHeader">
                    <h3>Notas externas</h3>
                    <span
                        class="syncStatus ${statusClass}"
                        role="status">
                        ${statusText}
                    </span>
                </header>

                <p class="settingsHint">
                    Notion se configura en Apps Script. El token de Notion nunca se guarda ni se envía a este navegador.
                </p>

                ${this.error
                    ? `
                        <p class="syncErrorHint" role="alert">
                            ${escapeHtml(this.error)}
                        </p>
                    `
                    : ""}

                ${status?.configured
                    ? `
                        <div class="notionConnectionDetails">
                            ${status.dataSourceName
                                ? `
                                    <p>
                                        <strong>Base:</strong>
                                        ${escapeHtml(
                                            status.dataSourceName
                                        )}
                                    </p>
                                `
                                : ""}

                            <p>
                                <strong>Data source:</strong>
                                <code>${escapeHtml(
                                    status.dataSourceId || "Configurado"
                                )}</code>
                            </p>
                        </div>
                    `
                    : `
                        <div class="notionSetupGuide">
                            <p>
                                Para activarlo, configurá estas propiedades del proyecto de Apps Script:
                            </p>
                            <ul>
                                <li>
                                    <code>TASK_ENGINE_NOTION_TOKEN</code>
                                </li>
                                <li>
                                    <code>TASK_ENGINE_NOTION_DATA_SOURCE_ID</code>
                                </li>
                            </ul>
                            <p class="settingsHint">
                                La integración de Notion debe tener acceso a la base que vas a usar para las notas de Task Engine.
                            </p>
                        </div>
                    `}

                <button
                    id="verifyNotionConnection"
                    type="button"
                    class="primaryAction"
                    ${this.loading ? "disabled" : ""}>
                    ${this.loading
                        ? "Comprobando…"
                        : "Verificar conexión"}
                </button>

            </section>
        `;

    }

    async refresh(validateRemote) {

        if (this.loading) return null;

        if (!this.app?.syncConfig?.isConfigured?.()) {

            this.error =
                "Configurá primero la conexión de sincronización con Apps Script.";
            this.status = null;
            this.renderPanel();
            return null;

        }

        const connection =
            this.app.syncConfig.get();
        const gateway =
            this.app.syncEngine?.gateway;

        if (!gateway?.notionStatus) {
            return null;
        }

        this.loading = true;
        this.error = "";
        this.renderPanel();

        try {

            this.status =
                await gateway.notionStatus({
                    ...connection,
                    validateRemote
                });

            return this.status;

        } catch (error) {

            this.status = null;
            this.error =
                error?.message ||
                "No se pudo comprobar la conexión con Notion.";

            return null;

        } finally {

            this.loading = false;
            this.renderPanel();

        }

    }

}
