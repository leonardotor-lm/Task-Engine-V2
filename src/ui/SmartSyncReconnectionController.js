import {
    SyncReconnectionAction
} from "../core/SyncReconnectionPolicy.js";
import {
    createSyncConflictDiagnostics
} from "../core/SyncConflictDiagnostics.js";
import { escapeHtml } from "./escapeHtml.js";

export class SmartSyncReconnectionController {

    constructor(app) {

        this.app = app;
        this.started = false;

    }

    start() {

        if (
            this.started ||
            !this.app ||
            typeof this.app.checkRemoteStatus !==
                "function"
        ) {
            return;
        }

        this.started = true;
        this.app.syncConflictDetails = [];

        this.wrapSidebarDiagnostics();

        const originalCheckRemoteStatus =
            this.app.checkRemoteStatus
                .bind(this.app);

        this.app.checkRemoteStatus = (...args) => {

            if (!this.shouldReconcile()) {
                return originalCheckRemoteStatus(
                    ...args
                );
            }

            return this.reconcile();

        };

    }

    wrapSidebarDiagnostics() {

        const sidebar =
            this.app?.mainView?.sidebar;

        if (
            !sidebar ||
            typeof sidebar.render !== "function"
        ) {
            return;
        }

        const originalRender =
            sidebar.render.bind(sidebar);

        sidebar.render = (...args) => {

            const html = originalRender(...args);
            const details =
                this.app.syncConflictDetails ?? [];

            if (!details.length) {
                return html;
            }

            const detailsHtml = `
                <details
                    class="syncConflictDetails"
                    open>
                    <summary>Diferencias detectadas</summary>
                    <ul>
                        ${details.map(detail => `
                            <li>${escapeHtml(detail)}</li>
                        `).join("")}
                    </ul>
                </details>
            `;

            return html.replace(
                '<p class="syncConflictHint">',
                `${detailsHtml}
                <p class="syncConflictHint">`
            );

        };

    }

    shouldReconcile() {

        const config = this.app?.syncConfig;

        return Boolean(
            config?.isConfigured?.() &&
            !config?.hasKnownSyncState?.()
        );

    }

    async createConflictDiagnostics() {

        try {

            const localBackup =
                this.app.backupService
                    .createBackup();
            const connection =
                this.app.syncConfig.get();
            const remoteResponse =
                await this.app.syncEngine
                    .gateway.load(connection);

            return createSyncConflictDiagnostics({
                localBackup,
                remoteBackup:
                    remoteResponse.data
            });

        } catch (error) {

            console.warn(
                "No se pudo generar el diagnóstico del conflicto.",
                error
            );

            return [
                "No se pudo obtener el detalle del conflicto."
            ];

        }

    }

    async reconcile() {

        if (
            this.app.syncCheckInProgress ||
            this.app.autoSyncInProgress
        ) {
            return null;
        }

        this.app.syncCheckInProgress = true;
        this.app.syncLastError = null;
        this.app.render({
            preserveTransientUi: true
        });

        try {

            const result =
                await this.app.syncEngine
                    .reconcileUnknownConnection();

            this.app.syncRemoteRevision =
                result.revision;
            this.app.syncRemoteUpdateAvailable =
                result.action ===
                SyncReconnectionAction.CONFLICT;
            this.app.autoSyncBlockedFingerprint =
                null;
            this.app.syncLastError = null;

            if (
                result.action ===
                    SyncReconnectionAction.CONFLICT
            ) {
                this.app.syncConflictDetails =
                    await this
                        .createConflictDiagnostics();

                console.warn(
                    "Diferencias de sincronización detectadas:",
                    this.app.syncConflictDetails
                );
            } else {
                this.app.syncConflictDetails = [];
            }

            if (
                [
                    SyncReconnectionAction.PULL,
                    SyncReconnectionAction.MERGE
                ].includes(result.action)
            ) {
                this.app.resetTransientState();
            }

            return result;

        } catch (error) {

            this.app.syncConflictDetails = [];
            this.app.syncLastError =
                error?.message ||
                "No se pudo reconciliar la conexión de sincronización.";

            console.warn(
                "No se pudo reconciliar la conexión de sincronización.",
                error
            );

            return null;

        } finally {

            this.app.syncCheckInProgress = false;
            this.app.autoSyncInProgress = false;
            this.app.render({
                preserveTransientUi: true
            });

        }

    }

}
