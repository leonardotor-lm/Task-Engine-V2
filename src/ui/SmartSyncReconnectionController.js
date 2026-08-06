import {
    SyncReconnectionAction
} from "../core/SyncReconnectionPolicy.js";

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

    shouldReconcile() {

        const config = this.app?.syncConfig;

        return Boolean(
            config?.isConfigured?.() &&
            !config?.hasKnownSyncState?.()
        );

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
                [
                    SyncReconnectionAction.PULL,
                    SyncReconnectionAction.MERGE
                ].includes(result.action)
            ) {
                this.app.resetTransientState();
            }

            return result;

        } catch (error) {

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
