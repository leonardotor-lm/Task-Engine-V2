export const ActivityType = Object.freeze({
    TASK_CREATED: "TASK_CREATED",
    TASK_UPDATED: "TASK_UPDATED",
    TASK_COMPLETED: "TASK_COMPLETED",
    TASK_REOPENED: "TASK_REOPENED",
    TASK_POSTPONED: "TASK_POSTPONED",
    TASK_ARCHIVED: "TASK_ARCHIVED",
    TASK_TRASHED: "TASK_TRASHED",
    TASK_RESTORED: "TASK_RESTORED",
    TASK_DELETED: "TASK_DELETED",
    TASK_DUPLICATED: "TASK_DUPLICATED",
    TASK_MOVED: "TASK_MOVED",
    RECURRENCE_ENDED: "RECURRENCE_ENDED",
    RECURRENCE_SKIPPED: "RECURRENCE_SKIPPED",
    ATTACHMENT_ADDED: "ATTACHMENT_ADDED",
    ATTACHMENT_REMOVED: "ATTACHMENT_REMOVED"
});

const VALID_TYPES = new Set(
    Object.values(ActivityType)
);

export class ActivityEvent {

    constructor(data = {}) {

        this.id = data.id ?? crypto.randomUUID();
        this.type = data.type;

        if (!VALID_TYPES.has(this.type)) {
            throw new Error(
                "El tipo de actividad es inválido."
            );
        }

        this.taskId = data.taskId ?? null;
        this.taskTitle = String(
            data.taskTitle ?? ""
        ).trim();

        if (!this.taskTitle) {
            throw new Error(
                "La actividad debe identificar la tarea."
            );
        }

        this.taskCount = data.taskCount ?? 1;

        if (
            !Number.isInteger(this.taskCount) ||
            this.taskCount < 1
        ) {
            throw new Error(
                "La cantidad de tareas de la actividad es inválida."
            );
        }

        this.details = String(
            data.details ?? ""
        ).trim();
        this.createdAt =
            data.createdAt ??
            new Date().toISOString();

        if (Number.isNaN(Date.parse(this.createdAt))) {
            throw new Error(
                "La fecha de la actividad es inválida."
            );
        }

        const version = data.version ?? 1;

        if (!Number.isInteger(version) || version < 1) {
            throw new Error(
                "La versión de la actividad es inválida."
            );
        }

        this.version = version;

    }

    toJSON() {

        return {
            id: this.id,
            type: this.type,
            taskId: this.taskId,
            taskTitle: this.taskTitle,
            taskCount: this.taskCount,
            details: this.details,
            createdAt: this.createdAt,
            updatedAt: this.createdAt,
            version: this.version
        };

    }

}
