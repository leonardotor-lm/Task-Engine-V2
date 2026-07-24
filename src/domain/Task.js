import { TaskStatus } from "./TaskStatus.js";
import { Priority } from "./Priority.js";
import { isValidRecurrenceFrequency } from "./Recurrence.js";

export class Task {

    constructor(data = {}) {

        this.id = data.id ?? crypto.randomUUID();

        const title = (data.title ?? "").trim();

        if (!title) {
            throw new Error("El título no puede estar vacío.");
        }

        this.title = title;

        this.description = data.description ?? "";

        this.status = data.status ?? TaskStatus.INBOX;

        this.statusBeforeDelete = data.statusBeforeDelete ?? null;

        this.areaId = data.areaId ?? null;

        this.contextId = data.contextId ?? null;

        this.priority = data.priority ?? Priority.NONE;

        this.tagIds = data.tagIds ?? [];

        this.attachments = data.attachments ?? [];

        this.parentTaskId = data.parentTaskId ?? null;

        this.recurrenceId = data.recurrenceId ?? null;

        this.recurrence = data.recurrence ?? null;

        this.manualOrder = data.manualOrder ?? 0;

        this.createdAt = data.createdAt ?? new Date().toISOString();

        this.updatedAt = data.updatedAt ?? this.createdAt;

        this.completedAt = data.completedAt ?? null;

        this.dueDate = data.dueDate ?? null;

        this.validateRecurrence(
            this.recurrence,
            this.dueDate
        );

        if (
            this.recurrence !== null &&
            this.recurrenceId === null
        ) {
            this.recurrenceId = crypto.randomUUID();
        }

        this.postponements = data.postponements ?? [];

    }

    validateRecurrence(recurrence, dueDate) {

        if (recurrence === null) return;

        if (!isValidRecurrenceFrequency(recurrence)) {
            throw new Error("Frecuencia de recurrencia inválida.");
        }

        if (!dueDate) {
            throw new Error(
                "La recurrencia necesita una fecha de vencimiento."
            );
        }

    }

    touch() {

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

        this.validateRecurrence(
            nextRecurrence,
            nextDueDate
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

        if (data.contextId !== undefined)
            this.contextId = data.contextId;

        if (data.priority !== undefined)
            this.priority = data.priority;

        if (data.tagIds !== undefined)
            this.tagIds = [...data.tagIds];

        if (data.dueDate !== undefined)
            this.dueDate = data.dueDate;

        if (data.recurrence !== undefined) {

            this.recurrence = data.recurrence;

            if (this.recurrence === null) {

                this.recurrenceId = null;

            } else if (this.recurrenceId === null) {

                this.recurrenceId = crypto.randomUUID();

            }

        }

        this.touch();

    }

    complete() {

        if (this.isArchived() || this.isDeleted()) {
            throw new Error("No se puede completar esta tarea.");
        }

        this.status = TaskStatus.COMPLETED;

        this.completedAt = new Date().toISOString();

        this.touch();

    }

    reopen() {

        if (!this.isCompleted()) {
            throw new Error("La tarea no está completada.");
        }

        this.status = TaskStatus.PENDING;

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

            areaId: this.areaId,

            contextId: this.contextId,

            priority: this.priority,

            tagIds: [...this.tagIds],

            attachments: [...this.attachments],

            parentTaskId: this.parentTaskId,

            recurrenceId: this.recurrenceId,

            recurrence: this.recurrence,

            manualOrder: this.manualOrder,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt,

            completedAt: this.completedAt,

            dueDate: this.dueDate,

            postponements: [...this.postponements]

        };

    }

}