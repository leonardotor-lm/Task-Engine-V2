export class SyncFocusWatcher {

    constructor({
        target = globalThis,
        documentRef = globalThis.document,
        onFocus,
        cooldownMs = 2 * 60 * 1000,
        now = () => Date.now()
    }) {

        this.target = target;
        this.document = documentRef;
        this.onFocus = onFocus;
        this.cooldownMs = cooldownMs;
        this.now = now;
        this.lastFocusCheckAt = null;
        this.started = false;
        this.handleFocus = () => {

            this.requestCheck();

        };
        this.handleOnline = () => {

            this.requestCheck({ force: true });

        };
        this.handleVisibilityChange = () => {

            if (
                this.document?.visibilityState ===
                "visible"
            ) {
                this.requestCheck();
            }

        };

    }

    requestCheck({ force = false } = {}) {

        const currentTime = this.now();
        const cooldownElapsed =
            this.lastFocusCheckAt === null ||
            currentTime - this.lastFocusCheckAt >=
                this.cooldownMs;

        if (!force && !cooldownElapsed) {
            return;
        }

        this.lastFocusCheckAt = currentTime;
        this.onFocus();

    }

    start() {

        if (
            this.started ||
            typeof this.target
                ?.addEventListener !== "function"
        ) {
            return;
        }

        this.target.addEventListener(
            "focus",
            this.handleFocus
        );
        this.target.addEventListener(
            "online",
            this.handleOnline
        );
        this.document?.addEventListener?.(
            "visibilitychange",
            this.handleVisibilityChange
        );

        // App.start() comprueba la nube justo antes de
        // iniciar este observador. Usamos ese instante
        // como comienzo del período de enfriamiento.
        this.lastFocusCheckAt = this.now();
        this.started = true;

    }

    stop() {

        if (
            !this.started ||
            typeof this.target
                ?.removeEventListener !== "function"
        ) {
            return;
        }

        this.target.removeEventListener(
            "focus",
            this.handleFocus
        );
        this.target.removeEventListener(
            "online",
            this.handleOnline
        );
        this.document?.removeEventListener?.(
            "visibilitychange",
            this.handleVisibilityChange
        );

        this.started = false;
        this.lastFocusCheckAt = null;

    }

}
