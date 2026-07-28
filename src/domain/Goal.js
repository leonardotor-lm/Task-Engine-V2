import {
    GoalStatus,
    isValidGoalStatus
} from "./GoalStatus.js";

export class Goal {

    constructor(data = {}) {

        this.id = data.id ?? crypto.randomUUID();

        const title = (data.title ?? "").trim();

        if (!title) {
            throw new Error(
                "El título del objetivo no puede estar vacío."
            );
        }

        this.title = title;
        this.description = data.description ?? "";
        this.status = data.status ?? GoalStatus.ACTIVE;
        this.statusBeforeDelete =
            data.statusBeforeDelete ?? null;

        if (!isValidGoalStatus(this.status)) {
            throw new Error(
                "El estado del objetivo es inválido."
            );
        }

        this.parentGoalId = data.parentGoalId ?? null;
        this.dueDate = data.dueDate ?? null;
        this.createdAt = data.createdAt ?? new Date().toISOString();
        this.updatedAt = data.updatedAt ?? this.createdAt;
        this.completedAt = data.completedAt ?? null;

        const version = data.version ?? 1;

        if (!Number.isInteger(version) || version < 1) {
            throw new Error(
                "La versión del objetivo es inválida."
            );
        }

        this.version = version;

        this.validateDueDate(this.dueDate);

        if (
            this.status === GoalStatus.COMPLETED &&
            this.completedAt === null
        ) {
            this.completedAt = this.updatedAt;
        }

        if (
            this.status === GoalStatus.ACTIVE ||
            this.status === GoalStatus.ARCHIVED
        ) {
            this.completedAt = null;
        }

    }

    validateDueDate(value) {

        if (value === null) return;

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            Number.isNaN(
                Date.parse(`${value}T00:00:00Z`)
            )
        ) {
            throw new Error(
                "La fecha límite del objetivo es inválida."
            );
        }

    }

    touch() {

        this.version += 1;
        this.updatedAt = new Date().toISOString();

    }

    update(data = {}) {

        if (data.title !== undefined) {

            const title = data.title.trim();

            if (!title) {
                throw new Error(
                    "El título del objetivo no puede estar vacío."
                );
            }

            this.title = title;

        }

        if (data.description !== undefined) {
            this.description = data.description;
        }

        if (data.parentGoalId !== undefined) {

            if (data.parentGoalId === this.id) {
                throw new Error(
                    "Un objetivo no puede ser su propio objetivo principal."
                );
            }

            this.parentGoalId = data.parentGoalId;

        }

        if (data.dueDate !== undefined) {

            this.validateDueDate(data.dueDate);
            this.dueDate = data.dueDate;

        }

        this.touch();

    }

    complete() {

        if (this.status !== GoalStatus.ACTIVE) {
            throw new Error(
                "Sólo se puede completar un objetivo activo."
            );
        }

        this.status = GoalStatus.COMPLETED;
        this.completedAt = new Date().toISOString();

        this.touch();

    }

    reopen() {

        if (this.status !== GoalStatus.COMPLETED) {
            throw new Error(
                "El objetivo no está completado."
            );
        }

        this.status = GoalStatus.ACTIVE;
        this.completedAt = null;

        this.touch();

    }

    archive() {

        if (this.status === GoalStatus.ARCHIVED) {
            throw new Error(
                "El objetivo ya está archivado."
            );
        }

        this.status = GoalStatus.ARCHIVED;
        this.completedAt = null;

        this.touch();

    }

    restoreFromArchive() {

        if (this.status !== GoalStatus.ARCHIVED) {
            throw new Error(
                "El objetivo no está archivado."
            );
        }

        this.status = GoalStatus.ACTIVE;

        this.touch();

    }

    delete() {

        if (this.status !== GoalStatus.DELETED) {
            this.statusBeforeDelete = this.status;
        }

        this.status = GoalStatus.DELETED;

        this.touch();

    }

    restoreFromTrash() {

        if (this.status !== GoalStatus.DELETED) {
            throw new Error(
                "El objetivo no está eliminado."
            );
        }

        this.status =
            this.statusBeforeDelete ??
            GoalStatus.ACTIVE;

        if (this.status !== GoalStatus.COMPLETED) {
            this.completedAt = null;
        }

        this.statusBeforeDelete = null;

        this.touch();

    }

    toJSON() {

        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: this.status,
            statusBeforeDelete:
                this.statusBeforeDelete,
            parentGoalId: this.parentGoalId,
            dueDate: this.dueDate,
            version: this.version,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            completedAt: this.completedAt
        };

    }

}
