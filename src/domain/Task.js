import { TaskStatus } from "./TaskStatus.js";
import { Priority } from "./Priority.js";
import {
    isValidRecurrenceFrequency,
    normalizeRecurrenceRule
} from "./Recurrence.js";
import {
    MAX_ATTACHMENTS_PER_TASK,
    normalizeAttachment,
    normalizeAttachments
} from "./Attachment.js";

function normalizeOptionalString(value) {

    if (value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim();

    return normalized || null;

}

export class Task {

    constructor(data = {}) {

        this.id = data.id ?? crypto.randomUUID();

        const title = (data.title ?? "").trim();

        if (!title) {
            throw new Error("El título no puede estar vacío.");
        }

        this.title = title;

        this.description = data.description ?? "";

        this.status =
            data.status ??
            (
                data.areaId
                    ? TaskStatus.PENDING
                    : TaskStatus.INBOX
            );

        this.statusBeforeDelete = data.statusBeforeDelete ?? null;

        this.statusBeforeCompletion =
            data.statusBeforeCompletion ?? null;

        this.isWaitingBeforeCompletion =
            data.isWaitingBeforeCompletion ?? null;

        this.areaId = data.areaId ?? null;

        this.contextId = data.contextId ?? null;

        this.priority = data.priority ?? Priority.NONE;

        this.tagIds = data.tagIds ?? [];

        this.goalIds = data.goalIds ?? [];

        this.attachments = normalizeAttachments(
            data.attachments ?? []
        );

        this.notionPageId =
            normalizeOptionalString(
                data.notionPageId
            );

        this.notionPageUrl =
            normalizeOptionalString(
                data.notionPageUrl
            );

        this.isWaiting =
            Boolean(data.isWaiting) &&
            [
                TaskStatus.INBOX,
                TaskStatus.PENDING
            ].includes(this.status);

        this.isProject = data.isProject === true;

        this.parentTaskId = data.parentTaskId ?? null;

        this.recurrenceId = data.recurrenceId ?? null;

        this.recurrence = data.recurrence ?? null;

        this.recurrenceInterval =
            data.recurrenceInterval ?? 1;

        this.recurrenceWeekdays = [
            ...(data.recurrenceWeekdays ?? [])
        ];

        this.manualOrder = data.manualOrder ?? 0;

        const version = data.version ?? 1;

        if (
            !Number.isInteger(version) ||
            version < 1
        ) {
            throw new Error(
                "La versión de la tarea es inválida."
            );
        }

        this.version = version;

        this.createdAt = data.createdAt ?? new Date().toISOString();

        this.updatedAt = data.updatedAt ?? this.createdAt;

        this.completedAt = data.completedAt ?? null;

        this.startDate = data.startDate ?? null;
        this.dueDate = data.dueDate ?? null;
        this.dueTime = data.dueTime ?? null;

        this.validateDateRange(
            this.startDate,
            this.dueDate
        );

        this.validateDueTime(
            this.dueTime,
            this.dueDate
        );

        this.validateRecurrence(
            this.recurrence,
            this.dueDate,
            {
                interval:
                    this.recurrenceInterval,
                weekdays:
                    this.recurrenceWeekdays
            }
        );

        if (this.recurrence === null) {

            this.recurrenceInterval = 1;
            this.recurrenceWeekdays = [];

        } else {

            const normalizedRule =
                normalizeRecurrenceRule(
                    this.recurrence,
                    {
                        interval:
                            this.recurrenceInterval,
                        weekdays:
                            this.recurrenceWeekdays
                    }
                );

            this.recurrenceInterval =
                normalizedRule.interval;

            this.recurrenceWeekdays = [
                ...normalizedRule.weekdays
            ];

        }

        if (
            this.recurrence !== null &&
            this.recurrenceId === null
        ) {
            this.recurrenceId = crypto.randomUUID();
        }

        this.postponements = data.postponements ?? [];

    }

    validateRecurrence(
        recurrence,
        dueDate,
        rule = {}
    ) {

        if (recurrence === null) return;

        if (!isValidRecurrenceFrequency(recurrence)) {
            throw new Error(
                "Frecuencia de recurrencia inválida."
            );
        }

        if (!dueDate) {
            throw new Error(
                "La recurrencia necesita una fecha de vencimiento."
            );
        }

        normalizeRecurrenceRule(
            recurrence,
            rule
        );

    }

    validateDueTime(dueTime, dueDate) {

        if (dueTime === null) return;

        if (!dueDate) {
            throw new Error(
                "La hora de vencimiento necesita una fecha."
            );
        }

        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime)) {
            throw new Error(
                "La hora de vencimiento es inválida."
            );
        }

    }

    validateDateRange(startDate, dueDate) {

        if (
            startDate &&
            dueDate &&
            startDate > dueDate
        ) {
            throw new Error(
                "La fecha de inicio no puede ser posterior al vencimiento."
            );
        }

    }

    touch() {

        this.version += 1;

        this.updatedAt = new Date().toISOString();

    }

    isCompleted() {

        return this.status === TaskStatus.COMPLETED;

    }

    isArchived() {

        return this.status === TaskStatus.ARCHIVED;

    }

    isDeleted() {

        return this.status === TaskStatus.DELETED;

    }

    update(data = {}) {

        const nextRecurrence =
            data.recurrence !== undefined
                ? data.recurrence
                : this.recurrence;

        const nextDueDate =
            data.dueDate !== undefined
                ? data.dueDate
                : this.dueDate;

        const nextStartDate =
            data.startDate !== undefined
                ? data.startDate
                : this.startDate;

        this.validateDateRange(
            nextStartDate,
            nextDueDate
        );

        const nextDueTime =
            data.dueTime !== undefined
                ? data.dueTime
                : data.dueDate === null
                    ? null
                    : this.dueTime;

        this.validateDueTime(
            nextDueTime,
            nextDueDate
        );

        const nextRecurrenceInterval =
            data.recurrenceInterval !==
                undefined
                ? data.recurrenceInterval
                : this.recurrenceInterval;

        const nextRecurrenceWeekdays =
            data.recurrenceWeekdays !==
                undefined
                ? data.recurrenceWeekdays
                : this.recurrenceWeekdays;

        this.validateRecurrence(
            nextRecurrence,
            nextDueDate,
            {
                interval:
                    nextRecurrenceInterval,
                weekdays:
                    nextRecurrenceWeekdays
            }
        );

        if (data.title !== undefined) {

            const title = data.title.trim();

            if (!title) {
                throw new Error("El título no puede estar vacío.");
            }

            this.title = title;

        }

        if (data.description !== undefined)
            this.description = data.description;

        if (data.areaId !== undefined) {

            this.areaId = data.areaId;

            if (
                this.status === TaskStatus.INBOX &&
                this.areaId !== null
            ) {
                this.status = TaskStatus.PENDING;
            }

        }

        if (data.parentTaskId !== undefined)
            this.parentTaskId = data.parentTaskId;

        if (data.contextId !== undefined)
            this.contextId = data.contextId;

        if (data.priority !== undefined)
            this.priority = data.priority;

        if (data.tagIds !== undefined)
            this.tagIds = [...data.tagIds];

        if (data.goalIds !== undefined)
            this.goalIds = [...data.goalIds];

        if (data.attachments !== undefined) {
            this.attachments =
                normalizeAttachments(
                    data.attachments
                );
        }

        if (data.notionPageId !== undefined) {
            this.notionPageId =
                normalizeOptionalString(
                    data.notionPageId
                );
        }

        if (data.notionPageUrl !== undefined) {
            this.notionPageUrl =
                normalizeOptionalString(
                    data.notionPageUrl
                );
        }

        if (data.isWaiting !== undefined) {

            const nextIsWaiting =
                Boolean(data.isWaiting);

            if (
                nextIsWaiting &&
                (
                    this.isCompleted() ||
                    this.isArchived() ||
                    this.isDeleted()
                )
            ) {
                throw new Error(
                    "Sólo una tarea incompleta puede quedar en espera."
                );
            }

            this.isWaiting = nextIsWaiting;

        }

        if (data.isProject !== undefined)
            this.isProject = Boolean(data.isProject);

        if (data.startDate !== undefined)
            this.startDate = data.startDate;

        if (data.dueDate !== undefined)
            this.dueDate = data.dueDate;

        if (
            data.dueTime !== undefined ||
            data.dueDate === null
        ) {
            this.dueTime = nextDueTime;
        }

        if (
            data.recurrenceInterval !==
                undefined
        ) {

            this.recurrenceInterval =
                Number(
                    data.recurrenceInterval
                );

        }

        if (
            data.recurrenceWeekdays !==
                undefined
        ) {

            this.recurrenceWeekdays = [
                ...new Set(
                    data.recurrenceWeekdays
                        .map(Number)
                )
            ].sort(
                (first, second) =>
                    first - second
            );

        }

        if (data.recurrence !== undefined) {

            this.recurrence = data.recurrence;

            if (this.recurrence === null) {

                this.recurrenceId = null;
                this.recurrenceInterval = 1;
                this.recurrenceWeekdays = [];

            } else if (this.recurrenceId === null) {

                this.recurrenceId =
                    crypto.randomUUID();

            }

        }

        this.touch();

    }

    addAttachment(data) {

        if (
            this.attachments.length >=
            MAX_ATTACHMENTS_PER_TASK
        ) {
            throw new Error(
                `Una tarea admite hasta ${MAX_ATTACHMENTS_PER_TASK} adjuntos.`
            );
        }

        const attachment =
            normalizeAttachment(data);

        if (
            this.attachments.some(item =>
                item.id === attachment.id ||
                item.driveFileId ===
                    attachment.driveFileId
            )
        ) {
            throw new Error(
                "El adjunto ya está asociado a la tarea."
            );
        }

        this.attachments.push(attachment);
        this.touch();

        return attachment;

    }

    removeAttachment(attachmentId) {

        const index = this.attachments
            .findIndex(
                attachment =>
                    attachment.id ===
                        attachmentId
            );

        if (index === -1) return null;

        const [removed] =
            this.attachments.splice(index, 1);

        this.touch();
        return removed;

    }

    complete() {

        if (this.isArchived() || this.isDeleted()) {
            throw new Error("No se puede completar esta tarea.");
        }

        this.statusBeforeCompletion = this.status;
        this.isWaitingBeforeCompletion = this.isWaiting;
        this.status = TaskStatus.COMPLETED;
        this.isWaiting = false;

        this.completedAt = new Date().toISOString();

        this.touch();

    }

    reopen() {

        if (!this.isCompleted()) {
            throw new Error("La tarea no está completada.");
        }

        this.status = TaskStatus.PENDING;
        this.statusBeforeCompletion = null;
        this.isWaitingBeforeCompletion = null;

        this.completedAt = null;

        this.touch();

    }

    undoCompletion() {

        if (!this.isCompleted()) {
            throw new Error("La tarea no está completada.");
        }

        this.status = [
            TaskStatus.INBOX,
            TaskStatus.PENDING
        ].includes(this.statusBeforeCompletion)
            ? this.statusBeforeCompletion
            : (
                this.areaId
                    ? TaskStatus.PENDING
                    : TaskStatus.INBOX
            );

        this.statusBeforeCompletion = null;
        this.isWaiting = Boolean(
            this.isWaitingBeforeCompletion
        );
        this.isWaitingBeforeCompletion = null;
        this.completedAt = null;

        this.touch();

    }

    restore() {

        return this.reopen();

    }

    archive() {

        if (this.isDeleted()) {
            throw new Error("No se puede archivar una tarea eliminada.");
        }

        this.status = TaskStatus.ARCHIVED;
        this.isWaiting = false;

        this.touch();

    }

    restoreFromArchive() {

        if (!this.isArchived()) {
            throw new Error("La tarea no está archivada.");
        }

        this.status = TaskStatus.PENDING;

        this.touch();

    }

    delete() {

        if (!this.isDeleted()) {
            this.statusBeforeDelete = this.status;
        }

        this.status = TaskStatus.DELETED;
        this.isWaiting = false;

        this.touch();

    }

    restoreFromTrash() {

        if (!this.isDeleted()) {
            throw new Error("La tarea no está eliminada.");
        }

        this.status =
            this.statusBeforeDelete ?? TaskStatus.PENDING;

        this.statusBeforeDelete = null;

        this.touch();

    }

    postpone(newDate) {

        if (!this.dueDate) {
            throw new Error(
                "La tarea necesita una fecha antes de poder posponerse."
            );
        }

        if (!newDate || newDate <= this.dueDate) {
            throw new Error(
                "La nueva fecha debe ser posterior a la fecha actual."
            );
        }

        this.postponements.push({

            from: this.dueDate,

            to: newDate,

            date: new Date().toISOString()

        });

        this.dueDate = newDate;

        this.touch();

    }

    toJSON() {

        return {

            id: this.id,

            title: this.title,

            description: this.description,

            status: this.status,

            statusBeforeDelete: this.statusBeforeDelete,

            statusBeforeCompletion:
                this.statusBeforeCompletion,

            isWaitingBeforeCompletion:
                this.isWaitingBeforeCompletion,

            areaId: this.areaId,

            contextId: this.contextId,

            priority: this.priority,

            tagIds: [...this.tagIds],

            goalIds: [...this.goalIds],

            attachments: this.attachments.map(
                attachment => ({
                    ...attachment
                })
            ),

            notionPageId: this.notionPageId,

            notionPageUrl: this.notionPageUrl,

            isWaiting: this.isWaiting,

            isProject: this.isProject,

            parentTaskId: this.parentTaskId,

            recurrenceId: this.recurrenceId,

            recurrence: this.recurrence,

            recurrenceInterval:
                this.recurrenceInterval,

            recurrenceWeekdays: [
                ...this.recurrenceWeekdays
            ],

            manualOrder: this.manualOrder,

            version: this.version,
            createdAt: this.createdAt,

            updatedAt: this.updatedAt,

            completedAt: this.completedAt,

            startDate: this.startDate,

            dueDate: this.dueDate,

            dueTime: this.dueTime,

            postponements: [...this.postponements]

        };

    }

}
