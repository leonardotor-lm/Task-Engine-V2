import { View } from "./View.js";

export function getTaskCreationDefaults(
    view,
    today
) {

    switch (view) {

        case View.TODAY:
            return {
                dueDate: today
            };

        default:
            return {};

    }

}

export function getTaskCreationView(view) {

    const directViews = [
        View.INBOX,
        View.TODAY,
        View.UPCOMING,
        View.ALL
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
        view === View.UPCOMING &&
        !task.dueDate
    ) {
        return View.INBOX;
    }

    return view;

}
