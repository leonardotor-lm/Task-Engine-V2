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

        this.syncMobileViewTitle();

        const taskButton = this.document?.getElementById(
            "openTaskCreation"
        );
        const projectTaskButton = this.document?.getElementById(
            "openProjectTaskCreation"
        );
        const goalButton = this.document?.getElementById(
            "openGoalCreation"
        );

        if (!taskButton && !projectTaskButton && !goalButton) return;

        if (!this.isMobile()) {
            if (taskButton) {
                this.restoreDesktopButton(taskButton);
            }
            if (projectTaskButton) {
                this.restoreProjectButton(projectTaskButton);
            }
            return;
        }

        const layout = this.document.querySelector(
            ".layout"
        );

        if (!layout) return;

        const goalsView = state.view === "goals";
        const projectView = state.view === "project";

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
                projectView ||
                state.selectedTask ||
                state.goalEditorOpen ||
                state.bulkSelectionMode
            );

            layout.append(taskButton);
        }

        if (projectView && projectTaskButton) {
            projectTaskButton.classList.add(
                "mobileFloatingTaskButton"
            );
            projectTaskButton.setAttribute(
                "aria-label",
                "Agregar subtarea"
            );
            projectTaskButton.setAttribute(
                "title",
                "Agregar subtarea"
            );
            projectTaskButton.hidden = Boolean(
                state.selectedTask ||
                state.goalEditorOpen ||
                state.bulkSelectionMode
            );

            layout.append(projectTaskButton);
        }

        if (goalsView && goalButton) {
            goalButton.classList.add(
                "mobileFloatingTaskButton"
            );
            layout.append(goalButton);
        }

    }

    syncMobileViewTitle() {

        if (!this.isMobile()) return;

        const mobileTitle = this.document?.querySelector(
            ".mobileHeader strong"
        );
        const viewTitle = this.document?.querySelector(
            ".taskListHeading h2"
        );

        if (!mobileTitle || !viewTitle) return;

        const title = String(
            viewTitle.textContent ?? ""
        )
            .replace(/\s+\(\d+\)$/, "")
            .trim();

        if (title) {
            mobileTitle.textContent = title;
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

    restoreProjectButton(button) {

        button.classList.remove(
            "mobileFloatingTaskButton"
        );
        button.hidden = false;

        const actions = this.document?.querySelector(
            ".taskListHeadingActions"
        );
        const bulkButton = this.document?.getElementById(
            "toggleBulkMode"
        );

        if (!actions) return;

        if (bulkButton?.parentElement === actions) {
            actions.insertBefore(
                button,
                bulkButton
            );
            return;
        }

        actions.append(button);

    }

}