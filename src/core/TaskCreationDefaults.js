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
