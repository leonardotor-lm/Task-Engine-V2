import { View } from "./View.js";

export function getTaskCreationDefaults(
    view,
    today,
    {
        areaId = null,
        goalId = null
    } = {}
) {

    switch (view) {

        case View.TODAY:
            return {
                dueDate: today
            };

        case View.TOMORROW: {

            const tomorrow = new Date(
                `${today}T12:00:00Z`
            );

            tomorrow.setUTCDate(
                tomorrow.getUTCDate() + 1
            );

            return {
                dueDate:
                    tomorrow.toISOString().slice(0, 10)
            };

        }

        case View.AREA:
            return areaId
                ? { areaId }
                : {};

        case View.GOAL:
            return goalId
                ? { goalIds: [goalId] }
                : {};

        case View.WAITING:
            return {
                isWaiting: true
            };

        case View.PROJECTS:
            return {
                isProject: true
            };

        default:
            return {};

    }

}

export function getTaskCreationView(view) {

    const directViews = [
        View.INBOX,
        View.TODAY,
        View.TOMORROW,
        View.UPCOMING,
        View.ALL,
        View.PROJECTS,
        View.AREA,
        View.WAITING,
        View.GOAL
    ];

    return directViews.includes(view)
        ? view
        : View.INBOX;

}

export function getPostCreationView(
    view,
    task
) {

    if (
        (
            view === View.TOMORROW ||
            view === View.UPCOMING
        ) &&
        !task.dueDate
    ) {
        return View.INBOX;
    }

    return view;

}
