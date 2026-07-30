import { View } from "./View.js";

export function getTaskCreationDefaults(
    view,
    today,
    {
        areaId = null
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
        View.AREA
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
