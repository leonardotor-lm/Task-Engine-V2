import { Priority } from "../domain/Priority.js";
import { TaskStatus } from "../domain/TaskStatus.js";

const DEFAULT_SEED_TASKS = new Map([
    [
        "Preparar clase de Literatura",
        Priority.HIGH
    ],
    [
        "Corregir evaluaciones",
        Priority.NONE
    ]
]);

function isEmptyArray(value) {

    return Array.isArray(value) &&
        value.length === 0;

}

function isUntouchedSeedTask(task) {

    if (!task || typeof task !== "object") {
        return false;
    }

    const expectedPriority =
        DEFAULT_SEED_TASKS.get(task.title);

    if (expectedPriority === undefined) {
        return false;
    }

    return (
        task.description === "" &&
        task.status === TaskStatus.INBOX &&
        task.statusBeforeDelete === null &&
        task.areaId === null &&
        task.contextId === null &&
        task.priority === expectedPriority &&
        isEmptyArray(task.tagIds) &&
        isEmptyArray(task.goalIds) &&
        isEmptyArray(task.attachments) &&
        task.isWaiting === false &&
        task.parentTaskId === null &&
        task.recurrenceId === null &&
        task.recurrence === null &&
        task.recurrenceInterval === 1 &&
        isEmptyArray(task.recurrenceWeekdays) &&
        task.manualOrder === 0 &&
        task.version === 1 &&
        typeof task.createdAt === "string" &&
        task.updatedAt === task.createdAt &&
        task.completedAt === null &&
        task.dueDate === null &&
        task.dueTime === null &&
        isEmptyArray(task.postponements)
    );

}

function isAutomaticSeedActivity(
    event,
    seedTasksById
) {

    if (!event || typeof event !== "object") {
        return false;
    }

    const task = seedTasksById.get(
        event.taskId
    );

    return Boolean(
        task &&
        event.type === "TASK_CREATED" &&
        event.taskTitle === task.title &&
        event.taskCount === 1 &&
        event.details === "" &&
        event.version === 1 &&
        typeof event.id === "string" &&
        typeof event.createdAt === "string" &&
        event.updatedAt === event.createdAt
    );

}

function activityContainsOnlyAutomaticSeedEvents(
    activityEvents,
    tasks
) {

    if (
        activityEvents === undefined ||
        activityEvents === null ||
        isEmptyArray(activityEvents)
    ) {
        return true;
    }

    if (
        !Array.isArray(activityEvents) ||
        activityEvents.length !== tasks.length
    ) {
        return false;
    }

    const seedTasksById = new Map(
        tasks.map(task => [task.id, task])
    );
    const eventTaskIds = new Set(
        activityEvents.map(event =>
            event?.taskId
        )
    );

    return (
        eventTaskIds.size === tasks.length &&
        activityEvents.every(event =>
            isAutomaticSeedActivity(
                event,
                seedTasksById
            )
        )
    );

}

function optionalDataIsEmpty(data, tasks) {

    return [
        "areas",
        "contexts",
        "tags",
        "customFilters",
        "goals"
    ].every(collection =>
        !Array.isArray(data[collection]) ||
        data[collection].length === 0
    ) &&
    activityContainsOnlyAutomaticSeedEvents(
        data.activityEvents,
        tasks
    ) &&
    (
        !data.taskSortPreferences ||
        (
            typeof data.taskSortPreferences ===
                "object" &&
            !Array.isArray(
                data.taskSortPreferences
            ) &&
            Object.keys(
                data.taskSortPreferences
            ).length === 0
        )
    ) &&
    (
        !data.displayPreferences ||
        (
            typeof data.displayPreferences ===
                "object" &&
            !Array.isArray(
                data.displayPreferences
            ) &&
            Object.keys(
                data.displayPreferences
            ).length === 0
        )
    );

}

export function isUntouchedDefaultSeedBackup(
    backup
) {

    const data = backup?.data;
    const tasks = data?.tasks;

    if (
        !Array.isArray(tasks) ||
        tasks.length !==
            DEFAULT_SEED_TASKS.size ||
        !optionalDataIsEmpty(data, tasks)
    ) {
        return false;
    }

    const titles = new Set(
        tasks.map(task => task?.title)
    );

    if (
        titles.size !==
            DEFAULT_SEED_TASKS.size ||
        [...DEFAULT_SEED_TASKS.keys()]
            .some(title => !titles.has(title))
    ) {
        return false;
    }

    return tasks.every(isUntouchedSeedTask);

}
