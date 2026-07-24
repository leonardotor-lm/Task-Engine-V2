export const TaskSort = Object.freeze({
    MANUAL: "MANUAL",
    DUE_DATE: "DUE_DATE",
    PRIORITY: "PRIORITY",
    CREATED_NEWEST: "CREATED_NEWEST",
    CREATED_OLDEST: "CREATED_OLDEST"
});

function compareText(a = "", b = "") {

    return String(a).localeCompare(
        String(b),
        "es",
        { sensitivity: "base" }
    );

}

function compareManualOrder(a, b) {

    const difference =
        (a.manualOrder ?? 0) -
        (b.manualOrder ?? 0);

    if (difference !== 0) {
        return difference;
    }

    return compareText(a.createdAt, b.createdAt);

}

export function compareTasks(
    a,
    b,
    sort = TaskSort.MANUAL
) {

    switch (sort) {

        case TaskSort.DUE_DATE: {

            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;

            const dateDifference = compareText(
                a.dueDate,
                b.dueDate
            );

            return dateDifference ||
                compareManualOrder(a, b);

        }

        case TaskSort.PRIORITY: {

            const priorityDifference =
                (b.priority ?? 0) -
                (a.priority ?? 0);

            return priorityDifference ||
                compareManualOrder(a, b);

        }

        case TaskSort.CREATED_NEWEST: {

            const dateDifference = compareText(
                b.createdAt,
                a.createdAt
            );

            return dateDifference ||
                compareManualOrder(a, b);

        }

        case TaskSort.CREATED_OLDEST: {

            const dateDifference = compareText(
                a.createdAt,
                b.createdAt
            );

            return dateDifference ||
                compareManualOrder(a, b);

        }

        case TaskSort.MANUAL:
        default:
            return compareManualOrder(a, b);

    }

}

export function sortTaskTree(
    tasks,
    sort = TaskSort.MANUAL
) {

    const tasksById = new Map(
        tasks.map(task => [task.id, task])
    );

    const originalPositions = new Map(
        tasks.map((task, index) => [task.id, index])
    );

    const childrenByParent = new Map();
    const roots = [];

    for (const task of tasks) {

        if (
            task.parentTaskId &&
            tasksById.has(task.parentTaskId)
        ) {

            const children =
                childrenByParent.get(task.parentTaskId) ?? [];

            children.push(task);

            childrenByParent.set(
                task.parentTaskId,
                children
            );

        } else {

            roots.push(task);

        }

    }

    const comparator = (a, b) => {

        return compareTasks(a, b, sort) ||
            originalPositions.get(a.id) -
            originalPositions.get(b.id);

    };

    roots.sort(comparator);

    for (const children of childrenByParent.values()) {
        children.sort(comparator);
    }

    const result = [];
    const visited = new Set();

    const visit = task => {

        if (visited.has(task.id)) return;

        visited.add(task.id);
        result.push(task);

        for (
            const child of
            childrenByParent.get(task.id) ?? []
        ) {
            visit(child);
        }

    };

    for (const root of roots) {
        visit(root);
    }

    for (const task of tasks) {
        visit(task);
    }

    return result;

}
