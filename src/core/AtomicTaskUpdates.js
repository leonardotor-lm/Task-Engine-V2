import { Task } from "../domain/Task.js";
import {
    ActivityType
} from "../domain/ActivityEvent.js";

const ALLOWED_FIELDS = new Set([
    "priority",
    "dueDate",
    "isWaiting",
    "areaId",
    "contextId",
    "tagIds"
]);

function validatePatch(patch) {
    if (
        !patch ||
        typeof patch !== "object" ||
        Array.isArray(patch)
    ) {
        throw new Error(
            "La actualización atómica contiene datos inválidos."
        );
    }

    const fields = Object.keys(patch);
    if (
        !fields.length ||
        fields.some(field => !ALLOWED_FIELDS.has(field))
    ) {
        throw new Error(
            "La actualización atómica contiene campos no admitidos."
        );
    }
}

function cloneTaskForAtomicUpdate(current) {
    const clone = new Task(current.toJSON());

    clone.statusBeforeCompletion =
        current.statusBeforeCompletion ?? null;
    clone.isWaitingBeforeCompletion =
        current.isWaitingBeforeCompletion ?? null;

    return clone;
}

export function applyAtomicTaskUpdates(
    taskService,
    updates = []
) {
    const repository = taskService?.repository;

    if (
        !repository?.getById ||
        !repository?.updateMany ||
        !repository?.replaceAll
    ) {
        throw new Error(
            "El repositorio no admite actualizaciones atómicas."
        );
    }

    if (!Array.isArray(updates) || !updates.length) {
        return [];
    }

    const seen = new Set();
    const prepared = updates.map(update => {
        const id = String(update?.id || "").trim();
        const patch = update?.changes;

        if (!id || seen.has(id)) {
            throw new Error(
                "La actualización atómica contiene una tarea inválida o duplicada."
            );
        }

        validatePatch(patch);

        const current = repository.getById(id);
        if (!current) {
            throw new Error("La tarea no existe.");
        }

        const before = current.toJSON();
        const next = cloneTaskForAtomicUpdate(current);
        next.update(patch);

        seen.add(id);
        return { current, before, next };
    });

    const originalTasks = repository.getAll();

    try {
        repository.updateMany(
            prepared.map(item => item.next)
        );
    } catch (error) {
        try {
            repository.replaceAll(originalTasks);
        } catch {
            // replaceAll restaura primero el estado en memoria;
            // si el almacenamiento sigue fallando, conservamos
            // el error original de la operación.
        }
        throw error;
    }

    for (const { before, next } of prepared) {
        const details = taskService.activityService
            ?.describeChanges?.(
                before,
                next.toJSON()
            );

        if (details) {
            taskService.activityService.recordTask?.(
                ActivityType.TASK_UPDATED,
                next,
                details
            );
        }
    }

    taskService.onAtomicTaskChanges?.(
        prepared.map(({ before, next }) => ({
            before,
            next: next.toJSON()
        }))
    );

    return prepared.map(item => item.next);
}
