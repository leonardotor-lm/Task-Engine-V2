import { Task } from "../domain/Task.js";

const GUARDED_METHODS = Object.freeze([
    "createTask",
    "createSubtask",
    "updateTask",
    "updateTasks",
    "permanentlyDeleteTasks",
    "emptyTrash",
    "toggleTask",
    "deleteTask",
    "permanentlyDeleteTask",
    "restoreDeletedTask",
    "moveTaskToProject",
    "moveTasks"
]);

function cloneTasks(tasks = []) {
    return tasks.map(task => new Task(task.toJSON()));
}

function restoreSafely(repository, snapshot) {
    try {
        repository?.replaceAll?.(snapshot);
    } catch {
        // La restauración prioriza recuperar el estado en memoria.
        // Si el almacenamiento continúa fallando, se conserva
        // y propaga el error original de la operación.
    }
}

export function installTaskServiceTransactionGuard(
    taskService,
    methodNames = GUARDED_METHODS
) {
    if (!taskService || taskService.__transactionGuardInstalled) {
        return taskService;
    }

    const taskRepository = taskService.repository;
    const activityRepository =
        taskService.activityService?.repository;

    if (
        !taskRepository?.getAll ||
        !taskRepository?.replaceAll
    ) {
        return taskService;
    }

    for (const methodName of methodNames) {
        const original = taskService[methodName];
        if (typeof original !== "function") continue;

        taskService[methodName] = (...args) => {
            const taskSnapshot = cloneTasks(
                taskRepository.getAll()
            );
            const activitySnapshot =
                activityRepository?.getAll?.() ?? null;

            try {
                return original.apply(taskService, args);
            } catch (error) {
                restoreSafely(
                    taskRepository,
                    taskSnapshot
                );

                if (
                    activitySnapshot !== null &&
                    activityRepository?.replaceAll
                ) {
                    restoreSafely(
                        activityRepository,
                        activitySnapshot
                    );
                }

                throw error;
            }
        };
    }

    taskService.__transactionGuardInstalled = true;
    return taskService;
}
