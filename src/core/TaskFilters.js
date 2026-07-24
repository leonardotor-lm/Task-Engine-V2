import { normalizeSearchText } from "./TaskSearch.js";

export const DueDateFilter = Object.freeze({
    TODAY: "TODAY",
    OVERDUE: "OVERDUE",
    UPCOMING: "UPCOMING",
    NO_DATE: "NO_DATE"
});

export function hasActiveTaskFilters(filters = {}) {

    return [
        filters.areaId,
        filters.contextId,
        filters.tagId,
        filters.priority,
        filters.due
    ].some(value => value !== undefined && value !== null && value !== "");

}

export function matchesTaskFilters(
    task,
    filters = {},
    today = ""
) {

    if (filters.areaId && task.areaId !== filters.areaId) {
        return false;
    }

    if (
        filters.contextId &&
        task.contextId !== filters.contextId
    ) {
        return false;
    }

    if (
        filters.tagId &&
        !task.tagIds.includes(filters.tagId)
    ) {
        return false;
    }

    if (
        filters.priority !== undefined &&
        filters.priority !== null &&
        filters.priority !== "" &&
        task.priority !== Number(filters.priority)
    ) {
        return false;
    }

    switch (filters.due) {

        case DueDateFilter.TODAY:
            return task.dueDate === today;

        case DueDateFilter.OVERDUE:
            return Boolean(
                task.dueDate &&
                task.dueDate < today
            );

        case DueDateFilter.UPCOMING:
            return Boolean(
                task.dueDate &&
                task.dueDate > today
            );

        case DueDateFilter.NO_DATE:
            return !task.dueDate;

        default:
            return true;

    }

}

export function filterTaskTreeByCriteria(
    tasks,
    {
        query = "",
        filters = {},
        today = ""
    } = {}
) {

    const normalizedQuery = normalizeSearchText(query);

    if (
        !normalizedQuery &&
        !hasActiveTaskFilters(filters)
    ) {
        return [...tasks];
    }

    const tasksById = new Map(
        tasks.map(task => [task.id, task])
    );

    const includedIds = new Set();

    for (const task of tasks) {

        const searchableText = normalizeSearchText(
            `${task.title ?? ""} ${task.description ?? ""}`
        );

        const matchesQuery =
            !normalizedQuery ||
            searchableText.includes(normalizedQuery);

        if (
            !matchesQuery ||
            !matchesTaskFilters(task, filters, today)
        ) {
            continue;
        }

        let currentTask = task;

        while (
            currentTask &&
            !includedIds.has(currentTask.id)
        ) {

            includedIds.add(currentTask.id);

            currentTask = tasksById.get(
                currentTask.parentTaskId
            );

        }

    }

    return tasks.filter(
        task => includedIds.has(task.id)
    );

}
