import {
    ActivityRepository
} from "../infrastructure/ActivityRepository.js";

const CHANGE_LABELS = Object.freeze({
    title: "título",
    description: "descripción",
    status: "estado",
    areaId: "área",
    contextId: "contexto",
    priority: "prioridad",
    tagIds: "etiquetas",
    goalIds: "objetivos",
    isWaiting: "espera",
    parentTaskId: "proyecto",
    recurrence: "recurrencia",
    recurrenceInterval: "intervalo",
    recurrenceWeekdays: "días",
    startDate: "inicio",
    dueDate: "vencimiento",
    dueTime: "hora"
});

function valuesMatch(first, second) {

    return JSON.stringify(first) ===
        JSON.stringify(second);

}

export class ActivityService {

    constructor(
        repository = new ActivityRepository()
    ) {

        this.repository = repository;

    }

    recordTask(type, task, details = "") {

        if (!task) return null;

        try {
            return this.repository.add({
                type,
                taskId: task.id ?? null,
                taskTitle: task.title,
                details
            });
        } catch {
            return null;
        }

    }

    recordTasks(type, tasks, details = "") {

        const unique = [
            ...new Map(
                (tasks ?? []).map(task => [
                    task.id,
                    task
                ])
            ).values()
        ];

        if (unique.length === 0) return null;

        if (unique.length === 1) {
            return this.recordTask(
                type,
                unique[0],
                details
            );
        }

        try {
            return this.repository.add({
                type,
                taskId: null,
                taskTitle: `${unique.length} tareas`,
                taskCount: unique.length,
                details
            });
        } catch {
            return null;
        }

    }

    describeChanges(before, after) {

        const changes = Object.entries(
            CHANGE_LABELS
        )
            .filter(([property]) =>
                !valuesMatch(
                    before?.[property],
                    after?.[property]
                )
            )
            .map(([, label]) => label);

        if (changes.length === 0) return "";

        if (changes.length === 1) {
            return `Cambiaste ${changes[0]}`;
        }

        if (changes.length === 2) {
            return `Cambiaste ${changes[0]} y ${changes[1]}`;
        }

        return `Cambiaste ${changes
            .slice(0, -1)
            .join(", ")} y ${changes.at(-1)}`;

    }

    getAllEvents() {

        return this.repository.getAll()
            .map((event, index) => ({
                event,
                index
            }))
            .sort((first, second) =>
                second.event.createdAt.localeCompare(
                    first.event.createdAt
                ) ||
                second.index - first.index
            )
            .map(item => item.event);

    }

    search({ query = "", category = "ALL" } = {}) {

        const normalizedQuery = query
            .trim()
            .toLocaleLowerCase("es");

        return this.getAllEvents().filter(event => {

            if (
                category !== "ALL" &&
                this.getCategory(event.type) !== category
            ) {
                return false;
            }

            if (!normalizedQuery) return true;

            return [
                event.taskTitle,
                event.details
            ].some(value =>
                value
                    .toLocaleLowerCase("es")
                    .includes(normalizedQuery)
            );

        });

    }

    getCategory(type) {

        if (type === "TASK_CREATED") {
            return "CREATION";
        }

        if (
            [
                "TASK_COMPLETED",
                "TASK_REOPENED"
            ].includes(type)
        ) {
            return "COMPLETION";
        }

        if (
            [
                "TASK_ARCHIVED",
                "TASK_TRASHED",
                "TASK_RESTORED",
                "TASK_DELETED"
            ].includes(type)
        ) {
            return "REMOVAL";
        }

        return "CHANGES";

    }

}
