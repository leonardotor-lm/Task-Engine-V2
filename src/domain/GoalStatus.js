export const GoalStatus = Object.freeze({

    ACTIVE: "ACTIVE",

    COMPLETED: "COMPLETED",

    ARCHIVED: "ARCHIVED"

});

export function isValidGoalStatus(value) {

    return Object
        .values(GoalStatus)
        .includes(value);

}
