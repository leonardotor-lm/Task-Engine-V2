import {
    TaskToolbarLayoutController
} from "./TaskToolbarLayoutController.js";

export class SidebarLayoutController
    extends TaskToolbarLayoutController {

    ensurePlanningGroup(navigation) {

        const group = super.ensurePlanningGroup(
            navigation
        );

        const body = group?.querySelector(
            ":scope > .sidebarNavigationGroupBody"
        );

        if (!body) return group;

        [
            "showAll",
            "showProjects",
            "showGoals",
            "showWaiting",
            "showCalendar",
            "showStatistics"
        ].forEach(id => {

            const button = document.getElementById(id);

            if (button) {
                body.append(button);
            }

        });

        return group;

    }

}
