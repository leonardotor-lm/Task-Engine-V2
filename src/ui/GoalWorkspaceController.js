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
            this.bindSubgoalNavigation(state);

        };

    }

    bindSubgoalNavigation(state) {

        if (state.view !== View.GOAL) {
            return;
        }

        this.document
            ?.querySelectorAll?.(
                ".goalWorkspaceSubgoal"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        this.app.mainView.callbacks
                            .onSelectGoal(
                                button.dataset.id
                            );
                    }
                );

            });

    }

}
