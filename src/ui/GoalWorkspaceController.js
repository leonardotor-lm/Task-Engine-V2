import { View } from "../core/View.js";

export class GoalWorkspaceController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;

    }

    start() {

        const mainView = this.app.mainView;
        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            originalRender(state);
            this.bindGoalNavigation(state);

        };

    }

    bindGoalNavigation(state) {

        if (state.view !== View.GOAL) {
            return;
        }

        this.bindGoalButtons(
            ".goalWorkspaceSubgoal, .goalBreadcrumbGoal"
        );

        this.document
            ?.getElementById?.(
                "backToParentGoal"
            )
            ?.addEventListener(
                "click",
                event => {
                    const goalId =
                        event.currentTarget?.dataset?.id;

                    if (!goalId) return;

                    this.selectGoal(goalId);
                }
            );

        this.document
            ?.getElementById?.(
                "goalBreadcrumbRoot"
            )
            ?.addEventListener(
                "click",
                () => {
                    this.app.mainView.callbacks
                        .onCloseGoalView();
                }
            );

    }

    bindGoalButtons(selector) {

        this.document
            ?.querySelectorAll?.(selector)
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        this.selectGoal(
                            button.dataset.id
                        );
                    }
                );

            });

    }

    selectGoal(goalId) {

        if (!goalId) return;

        this.app.mainView.callbacks
            .onSelectGoal(goalId);

    }

}
