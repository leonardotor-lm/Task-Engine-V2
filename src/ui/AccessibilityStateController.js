export class AccessibilityStateController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.started = false;

    }

    start() {

        const view = this.app?.mainView;

        if (
            this.started ||
            !view ||
            typeof view.render !== "function"
        ) {
            return;
        }

        this.started = true;

        const originalRender =
            view.render.bind(view);

        view.render = state => {

            originalRender(state);
            this.enhance();

        };

    }

    enhance() {

        if (!this.document) return;

        this.enhanceCurrentNavigation();
        this.enhanceTaskExpansion();
        this.enhanceDialogTriggers();
        this.enhanceGoalEditorTrigger();

    }

    enhanceCurrentNavigation() {

        const controls =
            this.document.querySelectorAll(
                ".sidebarButton, .showCustomFilter, .showGoalStatus"
            );

        controls.forEach(control => {

            if (
                control.classList?.contains(
                    "active"
                )
            ) {
                control.setAttribute(
                    "aria-current",
                    "page"
                );
            } else {
                control.removeAttribute(
                    "aria-current"
                );
            }

        });

    }

    enhanceTaskExpansion() {

        this.document.querySelectorAll(
            ".toggleSubtasks"
        ).forEach(button => {

            const label =
                button.getAttribute(
                    "aria-label"
                ) ?? "";

            if (label.startsWith("Contraer")) {
                button.setAttribute(
                    "aria-expanded",
                    "true"
                );
            } else if (
                label.startsWith("Expandir")
            ) {
                button.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }

        });

    }

    enhanceDialogTriggers() {

        [
            [
                "toggleAdvancedSearch",
                "advancedSearchDialog"
            ],
            [
                "openTaskTools",
                "taskToolsDialog"
            ],
            [
                "openSettings",
                "settingsDialog"
            ]
        ].forEach(([
            triggerId,
            dialogId
        ]) => {

            const trigger =
                this.document.getElementById(
                    triggerId
                );

            if (!trigger) return;

            const dialog =
                this.document.getElementById(
                    dialogId
                );

            trigger.setAttribute(
                "aria-haspopup",
                "dialog"
            );
            trigger.setAttribute(
                "aria-controls",
                dialogId
            );
            trigger.setAttribute(
                "aria-expanded",
                String(
                    Boolean(
                        dialog?.open ||
                        dialog?.dataset
                            ?.requestedOpen ===
                                "true"
                    )
                )
            );

        });

    }

    enhanceGoalEditorTrigger() {

        const trigger =
            this.document.getElementById(
                "editGoal"
            );

        if (!trigger) return;

        const panel =
            this.document.querySelector(
                ".goalDrawer"
            );

        trigger.setAttribute(
            "aria-expanded",
            String(Boolean(panel))
        );

        if (!panel) {
            trigger.removeAttribute(
                "aria-controls"
            );
            return;
        }

        if (!panel.id) {
            panel.id = "goalEditorPanel";
        }

        trigger.setAttribute(
            "aria-controls",
            panel.id
        );

    }

}
