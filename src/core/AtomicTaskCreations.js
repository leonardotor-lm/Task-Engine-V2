import { Task } from "../domain/Task.js";
import {
    ActivityType
} from "../domain/ActivityEvent.js";

function requireAtomicRepository(taskService) {
    const repository = taskService?.repository;

    if (
        !repository?.getAll ||
        !repository?.getById ||
        !repository?.replaceAll
    ) {
        throw new Error(
            "El repositorio no admite creaciones atómicas."
        );
    }

    return repository;
}

function restoreRepository(repository, originalTasks, error) {
    try {
        repository.replaceAll(originalTasks);
    } catch {
        // replaceAll restaura primero el estado en memoria;
        // si el almacenamiento sigue fallando, conservamos
        // el error original de la operación.
    }

    throw error;
}

function notifyAtomicChanges(taskService, changes) {
    taskService?.onAtomicTaskChanges?.(changes);
}

export function createTasksAtomically(
    taskService,
    taskData = []
) {
    const repository = requireAtomicRepository(taskService);

    if (!Array.isArray(taskData) || !taskData.length) {
        return [];
    }

    const originalTasks = repository.getAll();
    const created = taskData.map(data => {
        if (
            data?.isProject === true &&
            data?.recurrence
        ) {
            throw new Error(
                "La recurrencia sólo puede aplicarse a tareas sin subtareas."
            );
        }

        return new Task(data);
    });

    try {
        repository.replaceAll([
            ...originalTasks,
            ...created
        ]);
    } catch (error) {
        restoreRepository(
            repository,
            originalTasks,
            error
        );
    }

    for (const task of created) {
        taskService.activityService?.recordTask?.(
            ActivityType.TASK_CREATED,
            task
        );
    }

    notifyAtomicChanges(
        taskService,
        created.map(task => ({
            before: null,
            next: task.toJSON()
        }))
    );

    return created;
}

export function createSubtasksAtomically(
    taskService,
    proposals = []
) {
    const repository = requireAtomicRepository(taskService);

    if (!Array.isArray(proposals) || !proposals.length) {
        return [];
    }

    const originalTasks = repository.getAll();
    const seenParents = new Set();
    const parentReplacements = new Map();
    const parentBefore = new Map();
    const created = [];

    for (const proposal of proposals) {
        const parentId = String(
            proposal?.parentId || ""
        ).trim();
        const titles = Array.isArray(proposal?.titles)
            ? proposal.titles
            : [];

        if (
            !parentId ||
            seenParents.has(parentId) ||
            !titles.length
        ) {
            throw new Error(
                "La creación atómica contiene un proyecto inválido o duplicado."
            );
        }

        const parent = repository.getById(parentId);
        if (!parent) {
            throw new Error("La tarea principal no existe.");
        }

        if (
            taskService?.isActiveTask &&
            !taskService.isActiveTask(parent)
        ) {
            throw new Error(
                "No se pueden agregar subtareas a esta tarea."
            );
        }

        if (parent.recurrence) {
            throw new Error(
                "No se pueden agregar subtareas a una tarea recurrente."
            );
        }

        const parentCopy = new Task(parent.toJSON());
        parentCopy.update({ isProject: true });
        parentBefore.set(parent.id, parent.toJSON());
        parentReplacements.set(parent.id, parentCopy);

        for (const title of titles) {
            created.push({
                parent,
                task: new Task({
                    title,
                    parentTaskId: parent.id,
                    areaId: parent.areaId,
                    status: parent.status,
                    goalIds: [...(parent.goalIds ?? [])]
                })
            });
        }

        seenParents.add(parentId);
    }

    const nextTasks = originalTasks.map(task =>
        parentReplacements.get(task.id) ?? task
    );

    try {
        repository.replaceAll([
            ...nextTasks,
            ...created.map(entry => entry.task)
        ]);
    } catch (error) {
        restoreRepository(
            repository,
            originalTasks,
            error
        );
    }

    for (const { parent, task } of created) {
        taskService.activityService?.recordTask?.(
            ActivityType.TASK_CREATED,
            task,
            `Subtarea de ${parent.title}`
        );
    }

    notifyAtomicChanges(
        taskService,
        [
            ...parentReplacements.values()
        ].map(parent => ({
            before: parentBefore.get(parent.id),
            next: parent.toJSON()
        }))
    );

    return created.map(entry => entry.task);
}
