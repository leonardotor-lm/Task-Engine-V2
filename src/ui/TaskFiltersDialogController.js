function renderFilterIcon() {

    return `
        <svg
            class="icon mobileTaskToolbarIcon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            focusable="false">
            <path d="M4 5h16"></path>
            <path d="M7 12h10"></path>
            <path d="M10 19h4"></path>
        </svg>
    `;

}

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
            this.decorateFilterTrigger(state);
            this.moveClearButtonIntoFilters();
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

    decorateFilterTrigger(state = {}) {

        const button = this.document?.getElementById(
            "openTaskTools"
        );

        if (!button) return;

        const filtersActive = Object.values(
            state.taskFilters ?? {}
        ).some(Boolean);
        const label = filtersActive
            ? "Filtrar tareas; hay filtros activos"
            : "Filtrar tareas";

        button.classList.add(
            "taskContextToolbarIconButton"
        );
        button.classList.toggle(
            "active",
            filtersActive
        );
        button.dataset.active = String(filtersActive);
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
        button.innerHTML = renderFilterIcon();

    }

    moveClearButtonIntoFilters() {

        const dialog = this.document?.getElementById(
            "taskToolsDialog"
        );
        const filterSection = dialog?.querySelector(
            ".taskFilters"
        );
        const clearButton = dialog?.querySelector(
            "#clearTaskFilters"
        );

        if (!filterSection || !clearButton) return;

        clearButton.classList.add(
            "taskFilterClearAction"
        );
        filterSection.append(clearButton);

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
