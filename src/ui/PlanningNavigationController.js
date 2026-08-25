export class PlanningNavigationController {

    constructor(app) {
        this.app = app;
    }

    start() {

        const view = this.app.mainView;
        const originalRender = view.render.bind(view);

        view.render = state => {
            originalRender(state);
            this.applyPlanningOrder();
        };

    }

    applyPlanningOrder() {

        const allButton = document.getElementById("showAll");
        const projectsButton = document.getElementById("showProjects");
        const goalsButton = document.getElementById("showGoals");
        const waitingButton = document.getElementById("showWaiting");
        const calendarButton = document.getElementById("showCalendar");
        const statisticsButton = document.getElementById("showStatistics");

        if (
            !allButton ||
            !projectsButton ||
            !goalsButton ||
            !calendarButton ||
            !statisticsButton
        ) {
            return;
        }

        const navigation = allButton.parentElement;

        if (!navigation) return;

        const orderedButtons = [
            allButton,
            projectsButton,
            goalsButton,
            waitingButton,
            calendarButton,
            statisticsButton
        ].filter(Boolean);

        const historyGroup = navigation.querySelector(
            ".sidebarNavigationGroup"
        );

        for (const button of orderedButtons) {
            navigation.insertBefore(button, historyGroup);
        }

    }

}
