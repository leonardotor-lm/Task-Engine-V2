import { ProcessRepository, ProcessEntryRepository } from "../infrastructure/ProcessRepository.js";
import { ProgressType, ProcessStatus } from "../domain/Process.js";

export class ProcessService {
    constructor({ repository = new ProcessRepository(), entryRepository = new ProcessEntryRepository(), goalService, taskService } = {}) {
        Object.assign(this, { repository, entryRepository, goalService, taskService });
    }
    getEntries(id) {
        return this.entryRepository.getAll().filter(entry => entry.processId === id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    }
    isCompatibleEntry(process, entry) {
        return entry.progressType === process.progressType && (process.progressType !== ProgressType.QUANTITY || entry.unit === process.unit);
    }
    getAllProcesses() {
        return this.repository.getAll().map(process => {
            const entries = this.getEntries(process.id);
            const latest = entries.find(entry => this.isCompatibleEntry(process, entry));
            return { ...process.toJSON(), currentValue: latest?.value ?? process.currentValue,
                lastProgressAt: entries[0]?.createdAt ?? null };
        });
    }
    validateReferences(data) {
        if (data.objectiveId && !this.goalService?.getGoalById(data.objectiveId)) throw new Error("El objetivo no existe.");
        for (const id of data.taskIds ?? []) {
            if (!this.taskService?.getTaskById(id)) throw new Error("La tarea vinculada no existe.");
        }
    }
    createProcess(data) {
        this.validateReferences(data);
        return this.repository.add(data);
    }
    updateProcess(id, data) {
        const process = this.repository.getById(id);
        if (!process) throw new Error("El proceso no existe.");
        this.validateReferences(data);
        const next = process.update(data);
        const latest = this.getEntries(id).find(entry => this.isCompatibleEntry(next, entry));
        if (latest && next.progressType !== ProgressType.NONE && latest.value > next.targetValue) throw new Error("El total no puede ser menor que el último avance registrado.");
        return this.repository.update(next);
    }
    recordProgress(id, data) {
        const process = this.repository.getById(id);
        if (!process) throw new Error("El proceso no existe.");
        if (process.status !== ProcessStatus.ACTIVE) throw new Error("Reactivá el proceso para registrar un avance.");
        if (process.progressType !== ProgressType.NONE && data.value > process.targetValue) throw new Error("El avance no puede superar el total.");
        // Independent immutable entries preserve simultaneous device registrations.
        const previousTime = Date.parse(this.getEntries(id)[0]?.createdAt ?? "") || 0;
        const createdAt = data.createdAt ?? new Date(Math.max(Date.now(), previousTime + 1)).toISOString();
        return this.entryRepository.add({ ...data, createdAt, processId: id, progressType: process.progressType, unit: process.unit, targetValue: process.targetValue });
    }
}
