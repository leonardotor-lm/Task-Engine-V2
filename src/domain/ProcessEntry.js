import { ProgressType } from "./Process.js";

export class ProcessEntry {
    constructor(data = {}) {
        this.id = data.id ?? crypto.randomUUID();
        this.processId = data.processId;
        this.progressType = data.progressType ?? ProgressType.NONE;
        this.value = data.value ?? null;
        this.unit = String(data.unit ?? "");
        this.targetValue = data.targetValue ?? null;
        this.note = String(data.note ?? "").trim();
        this.createdAt = data.createdAt ?? new Date().toISOString();
        this.updatedAt = data.updatedAt ?? this.createdAt;
        this.version = data.version ?? 1;
        if (typeof this.processId !== "string" || !this.processId) throw new Error("El avance necesita un proceso.");
        if (!Object.values(ProgressType).includes(this.progressType)) throw new Error("La medición del avance es inválida.");
        if (this.progressType !== ProgressType.NONE && (!Number.isFinite(this.value) || this.value < 0)) throw new Error("El avance debe ser un número mayor o igual a cero.");
        if (this.progressType === ProgressType.PERCENTAGE && this.value > 100) throw new Error("El porcentaje no puede superar 100.");
        if (this.progressType === ProgressType.NONE && !this.note) throw new Error("Escribí una nota sobre el avance.");
        if (typeof this.id !== "string" || !this.id) throw new Error("El identificador del avance es inválido.");
        if (typeof this.createdAt !== "string" || typeof this.updatedAt !== "string" || Number.isNaN(Date.parse(this.updatedAt)) || Number.isNaN(Date.parse(this.createdAt))) throw new Error("La fecha del avance es inválida.");
        if (!Number.isInteger(this.version) || this.version < 1) throw new Error("La versión del avance es inválida.");
    }
    toJSON() { return { ...this }; }
}
