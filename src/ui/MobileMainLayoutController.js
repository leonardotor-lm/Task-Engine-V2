const MOBILE_LAYOUT_MEDIA = "(max-width: 760px)";

export class MobileMainLayoutController {

    constructor(
        app,
        {
            documentRef = globalThis.document,
            windowRef = globalThis.window
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.window = windowRef;
        this.latestState = null;
        this.mediaQuery =
            this.window?.matchMedia?.(
                MOBILE_LAYOUT_MEDIA
            ) ?? null;
        this.mediaChangeHandler = null;

    }

    start() {

        const mainView = this.app.mainView;
        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            originalRender(state);
            this.latestState = state;
            this.applyLayout(state);

        };

        this.mediaChangeHandler = () => {
            this.applyLayout(this.latestState);
        };

        this.mediaQuery?.addEventListener?.(
            "change",
            this.mediaChangeHandler
        );

    }

    isMobile() {

        return Boolean(
            this.mediaQuery?.matches
        );

    }

    applyLayout(state = {}) {

        const button = this.document?.getElementById(
            "openTaskCreation"
        );

        if (!button) return;

        if (!this.isMobile()) {
            this.restoreDesktopButton(button);
            return;
        }

        const layout = this.document.querySelector(
            ".layout"
        );

        if (!layout) return;

        button.classList.add(
            "mobileFloatingTaskButton"
        );
        button.setAttribute(
            "aria-label",
            "Nueva tarea"
        );
        button.setAttribute(
            "title",
            "Nueva tarea"
        );
        button.hidden = Boolean(
            state.selectedTask ||
            state.goalEditorOpen ||
            state.bulkSelectionMode
        );

        layout.append(button);

    }

    restoreDesktopButton(button) {

        button.classList.remove(
            "mobileFloatingTaskButton"
        );
        button.hidden = false;

        const brand = this.document?.querySelector(
            "#appSidebar .sidebarBrand"
        );

        if (brand) {
            brand.insertAdjacentElement(
                "afterend",
                button
            );
        }

    }

}
