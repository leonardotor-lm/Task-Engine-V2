export class SyncFocusWatcher {

    constructor({
        target = globalThis,
        onFocus
    }) {

        this.target = target;
        this.onFocus = onFocus;
        this.started = false;
        this.handleFocus = () => {

            this.onFocus();

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

        this.started = false;

    }

}
