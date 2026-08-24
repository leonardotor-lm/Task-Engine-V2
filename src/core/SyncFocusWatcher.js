export class SyncFocusWatcher {

    constructor({
        target = globalThis,
        documentRef = globalThis.document,
        onFocus
    }) {

        this.target = target;
        this.document = documentRef;
        this.onFocus = onFocus;
        this.started = false;
        this.handleFocus = () => {

            this.onFocus();

        };
        this.handleVisibilityChange = () => {

            if (
                this.document?.visibilityState ===
                "visible"
            ) {
                this.onFocus();
            }

        };

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
            this.handleFocus
        );
        this.document?.addEventListener?.(
            "visibilitychange",
            this.handleVisibilityChange
        );

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
            this.handleFocus
        );
        this.document?.removeEventListener?.(
            "visibilitychange",
            this.handleVisibilityChange
        );

        this.started = false;

    }

}
