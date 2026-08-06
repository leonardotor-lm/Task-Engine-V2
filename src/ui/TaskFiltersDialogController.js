export class TaskFiltersDialogController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.escapeHandler = null;
        this.pointerHandler = null;

    }

    start() {

        const mainView = this.app.mainView;
        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            this.clearDismissalBindings();
            originalRender(state);
            this.removeVisibleSortLabel();
            this.bindDialogDismissal();

        };

    }

    removeVisibleSortLabel() {

        const select = this.document?.getElementById(
            "taskSort"
        );

        if (!select) return;

        select.setAttribute(
            "aria-label",
            "Ordenar tareas"
        );

        const wrapper = select.closest(
            ".taskContextToolbarSort"
        );

        if (!wrapper) return;

        wrapper.querySelector(
            ":scope > span"
        )?.remove();

        if (
            wrapper.tagName?.toLowerCase() !==
            "label"
        ) {
            return;
        }

        const container =
            this.document.createElement("div");

        container.className = wrapper.className;
        container.append(select);
        wrapper.replaceWith(container);

    }

    bindDialogDismissal() {

        const dialog = this.document?.getElementById(
            "taskToolsDialog"
        );

        if (!dialog) return;

        const dismiss = () => {

            if (!dialog.open) return;

            this.app.mainView.callbacks
                .onCloseTaskTools();

        };

        this.escapeHandler = event => {

            if (
                event.key !== "Escape" ||
                !dialog.open
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            dismiss();

        };

        this.pointerHandler = event => {

            if (
                !dialog.open ||
                !this.isOutsideDialog(dialog, event)
            ) {
                return;
            }

            dismiss();

        };

        this.document.addEventListener(
            "keydown",
            this.escapeHandler,
            true
        );
        this.document.addEventListener(
            "pointerdown",
            this.pointerHandler,
            true
        );

    }

    isOutsideDialog(dialog, event) {

        const target = event.target;

        if (target !== dialog) {
            return !dialog.contains(target);
        }

        const rect = dialog.getBoundingClientRect();

        return (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        );

    }

    clearDismissalBindings() {

        if (this.escapeHandler) {
            this.document?.removeEventListener(
                "keydown",
                this.escapeHandler,
                true
            );
            this.escapeHandler = null;
        }

        if (this.pointerHandler) {
            this.document?.removeEventListener(
                "pointerdown",
                this.pointerHandler,
                true
            );
            this.pointerHandler = null;
        }

    }

}
