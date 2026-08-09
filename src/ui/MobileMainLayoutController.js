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

        const taskButton = this.document?.getElementById(
            "openTaskCreation"
        );
        const goalButton = this.document?.getElementById(
            "openGoalCreation"
        );

        if (!taskButton && !goalButton) return;

        if (!this.isMobile()) {
            if (taskButton) {
                this.restoreDesktopButton(taskButton);
            }
            return;
        }

        const layout = this.document.querySelector(
            ".layout"
        );

        if (!layout) return;

        const goalsView = state.view === "goals";

        if (taskButton) {
            taskButton.classList.add(
                "mobileFloatingTaskButton"
            );
            taskButton.setAttribute(
                "aria-label",
                "Nueva tarea"
            );
            taskButton.setAttribute(
                "title",
                "Nueva tarea"
            );
            taskButton.hidden = Boolean(
                goalsView ||
                state.selectedTask ||
                state.goalEditorOpen ||
                state.bulkSelectionMode
            );

            layout.append(taskButton);
        }

        if (goalsView && goalButton) {
            goalButton.classList.add(
                "mobileFloatingTaskButton"
            );
            layout.append(goalButton);
        }

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
