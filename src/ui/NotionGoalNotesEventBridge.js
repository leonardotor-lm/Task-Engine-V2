export class NotionGoalNotesEventBridge {

    constructor(
        app,
        controller,
        {
            documentRef = globalThis.document
        } = {}
    ) {
        this.app = app;
        this.controller = controller;
        this.document = documentRef;
        this.started = false;
    }

    start() {

        if (this.started || !this.document?.addEventListener) {
            return;
        }

        this.started = true;

        this.document.addEventListener(
            "click",
            event => {

                const target = event.target?.closest?.(
                    "#createNotionGoalNote, #unlinkNotionGoalNote"
                );

                if (!target) return;

                const goalId = this.app?.selectedGoal?.id;

                if (!goalId) return;

                if (target.id === "createNotionGoalNote") {
                    this.controller.create(goalId);
                    return;
                }

                this.controller.unlink(goalId);

            }
        );

    }

}
