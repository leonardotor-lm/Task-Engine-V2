export class OverlayDismissalController {

    constructor(
        app,
        {
            documentRef = globalThis.document,
            queueMicrotaskRef = globalThis.queueMicrotask
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.queueMicrotask =
            queueMicrotaskRef ?? (callback =>
                Promise.resolve().then(callback));
        this.started = false;
        this.events = null;

    }

    start() {

        const mainView = this.app?.mainView;

        if (
            this.started ||
            !mainView ||
            typeof mainView.render !== "function"
        ) {
            return;
        }

        this.started = true;

        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            this.clearBindings();
            originalRender(state);
            this.bind(state);

        };

    }

    bind(state) {

        if (!this.document) return;

        this.events = new AbortController();
        const { signal } = this.events;
        const callbacks =
            this.app.mainView.callbacks;

        this.bindDialog({
            id: "advancedSearchDialog",
            dismiss: () =>
                callbacks.onCloseAdvancedSearch(),
            opener: () =>
                this.document.getElementById(
                    "toggleAdvancedSearch"
                ),
            signal
        });

        this.bindDialog({
            id: "settingsDialog",
            dismiss: () =>
                callbacks.onCloseSettings(),
            opener: () =>
                this.document.getElementById(
                    "openSettings"
                ),
            signal
        });

        this.bindDialog({
            id: "calendarDayDialog",
            dismiss: () =>
                callbacks.onCloseCalendarDay(),
            opener: () =>
                this.findCalendarDay(
                    state?.calendarSelectedDate
                ),
            signal
        });

        if (state?.goalEditorOpen) {
            this.bindPanel({
                selector: ".goalDrawer",
                dismiss: () =>
                    callbacks.onCloseGoalEditor(),
                opener: () =>
                    this.document.getElementById(
                        "editGoal"
                    ),
                signal
            });
        }

    }

    bindDialog({
        id,
        dismiss,
        opener,
        signal
    }) {

        const dialog =
            this.document.getElementById(id);

        if (!dialog) return;

        const close = restoreFocus => {

            if (!dialog.open) return;

            dismiss();

            if (restoreFocus) {
                this.restoreFocus(opener);
            }

        };

        this.document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Escape" ||
                    !dialog.open ||
                    !this.isTopDialog(dialog)
                ) {
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();
                close(true);

            },
            {
                signal,
                capture: true
            }
        );

        this.document.addEventListener(
            "pointerdown",
            event => {

                if (
                    !dialog.open ||
                    !this.isTopDialog(dialog) ||
                    !this.isOutsideDialog(
                        dialog,
                        event
                    )
                ) {
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();
                close(false);

            },
            {
                signal,
                capture: true
            }
        );

    }

    bindPanel({
        selector,
        dismiss,
        opener,
        signal
    }) {

        const panel =
            this.document.querySelector(selector);

        if (!panel) return;

        const close = restoreFocus => {

            dismiss();

            if (restoreFocus) {
                this.restoreFocus(opener);
            }

        };

        this.document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Escape" ||
                    this.hasOpenDialog()
                ) {
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();
                close(true);

            },
            {
                signal,
                capture: true
            }
        );

        this.document.addEventListener(
            "pointerdown",
            event => {

                if (
                    this.hasOpenDialog() ||
                    panel.contains(event.target)
                ) {
                    return;
                }

                event.preventDefault();
                event.stopImmediatePropagation();
                close(false);

            },
            {
                signal,
                capture: true
            }
        );

    }

    isOutsideDialog(dialog, event) {

        const target = event.target;

        if (target !== dialog) {
            return !dialog.contains(target);
        }

        const rect =
            dialog.getBoundingClientRect();

        return (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        );

    }

    isTopDialog(dialog) {

        const openDialogs = [
            ...this.document.querySelectorAll(
                "dialog[open]"
            )
        ];

        return openDialogs.at(-1) === dialog;

    }

    hasOpenDialog() {

        return Boolean(
            this.document.querySelector(
                "dialog[open]"
            )
        );

    }

    findCalendarDay(date) {

        if (!date) return null;

        return [
            ...this.document.querySelectorAll(
                ".calendarDay"
            )
        ].find(
            day => day.dataset.date === date
        ) ?? null;

    }

    restoreFocus(opener) {

        this.queueMicrotask(() => {

            const element = opener?.();

            if (
                element?.isConnected !== false &&
                typeof element?.focus === "function"
            ) {
                element.focus();
            }

        });

    }

    clearBindings() {

        this.events?.abort();
        this.events = null;

    }

}
