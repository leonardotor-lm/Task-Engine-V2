const DEFAULT_RETRY_DELAYS = Object.freeze([
    5000,
    15000,
    30000,
    60000
]);

export class OfflineSyncRecoveryController {

    constructor(
        app,
        {
            windowRef = globalThis.window,
            setTimeoutFn = globalThis.setTimeout,
            clearTimeoutFn = globalThis.clearTimeout,
            retryDelays = DEFAULT_RETRY_DELAYS
        } = {}
    ) {

        this.app = app;
        this.window = windowRef;
        this.setTimeout = setTimeoutFn;
        this.clearTimeout = clearTimeoutFn;
        this.retryDelays = [...retryDelays];
        this.retryAttempt = 0;
        this.retryTimer = null;
        this.started = false;
        this.originalCheckRemoteStatus = null;
        this.originalRunAutomaticPush = null;
        this.handleOffline = () => this.markOffline();
        this.handleOnline = () => this.recoverOnline();

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
        this.originalCheckRemoteStatus =
            this.app.checkRemoteStatus.bind(this.app);
        this.originalRunAutomaticPush =
            typeof this.app.runAutomaticPush ===
                "function"
                ? this.app.runAutomaticPush.bind(this.app)
                : null;

        this.app.checkRemoteStatus = (...args) =>
            this.observeSyncAttempt(
                this.originalCheckRemoteStatus,
                args
            );

        if (this.originalRunAutomaticPush) {
            this.app.runAutomaticPush = (...args) =>
                this.observeSyncAttempt(
                    this.originalRunAutomaticPush,
                    args
                );
        }

        this.window?.addEventListener?.(
            "offline",
            this.handleOffline
        );
        this.window?.addEventListener?.(
            "online",
            this.handleOnline
        );

        if (this.isOffline()) {
            this.markOffline();
        }

    }

    stop() {

        if (!this.started) return;

        this.cancelRetry();
        this.window?.removeEventListener?.(
            "offline",
            this.handleOffline
        );
        this.window?.removeEventListener?.(
            "online",
            this.handleOnline
        );
        this.started = false;

    }

    isOffline() {

        return this.window?.navigator?.onLine ===
            false;

    }

    hasBlockingInteraction() {

        if (
            typeof this.app
                ?.hasSyncBlockingInteraction ===
                "function"
        ) {
            return this.app
                .hasSyncBlockingInteraction();
        }

        const view = this.app?.mainView;

        return Boolean(
            view?.hasActiveEntityEdit?.() ||
            view?.hasActiveEntityCreation?.() ||
            view?.hasActiveTransientForm?.(
                this.app.selectedGoal
            ) ||
            view?.hasUnsavedTaskEdit?.(
                this.app.selectedTask
            )
        );

    }

    markOffline() {

        this.cancelRetry();
        this.app.syncOffline = true;
        this.app.syncLastError = null;
        this.app.render?.({
            preserveTransientUi: true
        });

    }

    recoverOnline() {

        this.app.syncOffline = false;
        this.retryAttempt = 0;
        this.cancelRetry();

        if (this.hasBlockingInteraction()) {
            this.scheduleRetry(false);
            this.app.render?.({
                preserveTransientUi: true
            });
            return;
        }

        void this.app.checkRemoteStatus();

    }

    async observeSyncAttempt(operation, args) {

        if (this.isOffline()) {
            this.markOffline();
            return null;
        }

        this.app.syncOffline = false;
        const result = await operation(...args);

        if (
            this.app.syncLastError &&
            !this.app.syncRemoteUpdateAvailable &&
            this.app.syncConfig?.isConfigured?.()
        ) {
            this.scheduleRetry();
        } else if (
            this.app.syncRemoteUpdateAvailable &&
            this.hasBlockingInteraction()
        ) {
            this.scheduleRetry(false);
        } else {
            this.retryAttempt = 0;
            this.cancelRetry();
        }

        return result;

    }

    scheduleRetry(incrementAttempt = true) {

        if (
            this.retryTimer !== null ||
            this.isOffline() ||
            !this.app.syncConfig?.isConfigured?.() ||
            (
                incrementAttempt &&
                this.retryAttempt >=
                    this.retryDelays.length
            )
        ) {
            return;
        }

        const index = Math.min(
            this.retryAttempt,
            this.retryDelays.length - 1
        );
        const delay = this.retryDelays[index];

        if (incrementAttempt) {
            this.retryAttempt += 1;
        }

        this.retryTimer = this.setTimeout(
            () => {
                this.retryTimer = null;

                if (this.hasBlockingInteraction()) {
                    this.scheduleRetry(false);
                    return;
                }

                void this.app.checkRemoteStatus();
            },
            delay
        );

    }

    cancelRetry() {

        if (this.retryTimer !== null) {
            this.clearTimeout(this.retryTimer);
        }

        this.retryTimer = null;

    }

}
