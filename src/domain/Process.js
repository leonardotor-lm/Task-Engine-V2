export const ProcessStatus = Object.freeze({ ACTIVE: "ACTIVE", PAUSED: "PAUSED", COMPLETED: "COMPLETED", ARCHIVED: "ARCHIVED" });
export const ProgressType = Object.freeze({ NONE: "NONE", PERCENTAGE: "PERCENTAGE", QUANTITY: "QUANTITY" });

export function localProcessStartDate(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export class Process {
    constructor(data = {}) {
        this.id = data.id ?? crypto.randomUUID();
        this.title = String(data.title ?? "").trim();
        if (!this.title) throw new Error("El título del proceso no puede estar vacío.");
        this.notes = String(data.notes ?? "");
        this.nextStep = String(data.nextStep ?? "");
        this.status = data.status ?? ProcessStatus.ACTIVE;
        this.objectiveId = data.objectiveId || null;
        this.progressType = data.progressType ?? ProgressType.NONE;
        this.currentValue = data.currentValue ?? 0;
        this.targetValue = this.progressType === ProgressType.PERCENTAGE ? 100 : (data.targetValue ?? null);
        this.unit = String(data.unit ?? "").trim();
        this.taskIds = [...new Set(data.taskIds ?? [])];
        this.startedAt = data.startedAt ?? localProcessStartDate();
        this.createdAt = data.createdAt ?? new Date().toISOString();
        this.updatedAt = data.updatedAt ?? this.createdAt;
        this.completedAt = this.status === ProcessStatus.COMPLETED ? (data.completedAt ?? this.updatedAt) : null;
        this.version = data.version ?? 1;
        if (!Object.values(ProcessStatus).includes(this.status)) throw new Error("El estado del proceso es inválido.");
        if (!Object.values(ProgressType).includes(this.progressType)) throw new Error("La medición del proceso es inválida.");
        if (!Number.isInteger(this.version) || this.version < 1) throw new Error("La versión del proceso es inválida.");
        if (!Array.isArray(data.taskIds ?? []) || this.taskIds.some(id => typeof id !== "string" || !id)) throw new Error("Las tareas vinculadas son inválidas.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(this.startedAt) || Number.isNaN(Date.parse(this.startedAt))) throw new Error("La fecha de inicio es inválida.");
        if (typeof this.id !== "string" || !this.id || (this.objectiveId !== null && typeof this.objectiveId !== "string")) throw new Error("El identificador del proceso u objetivo es inválido.");
        for (const timestamp of [this.createdAt, this.updatedAt, ...(this.completedAt ? [this.completedAt] : [])]) {
            if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) throw new Error("La fecha del proceso es inválida.");
        }
        if (!Number.isFinite(this.currentValue) || this.currentValue < 0) throw new Error("El avance debe ser un número mayor o igual a cero.");
        if (this.progressType !== ProgressType.NONE) {
            if (!Number.isFinite(this.targetValue) || this.targetValue <= 0 || this.currentValue > this.targetValue) throw new Error("El avance debe estar entre cero y la cantidad total.");
            if (this.progressType === ProgressType.QUANTITY && !this.unit) throw new Error("Indicá la unidad del avance.");
        }
    }

    toJSON() {
        return { ...this, taskIds: [...this.taskIds] };
    }

    update(data) {
        const measurementChanged = (data.progressType !== undefined && data.progressType !== this.progressType) ||
            (data.unit !== undefined && data.unit.trim() !== this.unit);
        return new Process({ ...this.toJSON(), ...(measurementChanged ? { currentValue: 0 } : {}), ...data, id: this.id, createdAt: this.createdAt,
            completedAt: data.status === ProcessStatus.COMPLETED && this.status !== ProcessStatus.COMPLETED ? new Date().toISOString() : this.completedAt,
            updatedAt: new Date().toISOString(), version: this.version + 1 });
    }
}
