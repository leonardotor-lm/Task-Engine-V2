import { TaskRepository } from "../infrastructure/TaskRepository.js";
import { Task } from "../domain/Task.js";
import { TaskStatus } from "../domain/TaskStatus.js";
import { getNextRecurrenceDate } from "../domain/Recurrence.js";

export class TaskService {

    constructor(repository = new TaskRepository()) {

        this.repository = repository;

    }

    createTask(data) {

        return this.repository.add(data);

    }

    createSubtask(parentId, title) {

        const parent = this.repository.getById(parentId);

        if (!parent) {
            throw new Error("La tarea principal no existe.");
        }

        if (!this.isActiveTask(parent)) {
            throw new Error(
                "No se pueden agregar subtareas a esta tarea."
            );
        }

        if (parent.recurrence) {
            throw new Error(
                "No se pueden agregar subtareas a una tarea recurrente."
            );
        }

        return this.repository.add({
            title,
            parentTaskId: parent.id,
            status: parent.status
        });

    }

    getDirectSubtasks(parentId) {

        return this.repository
            .getAll()
            .filter(task => task.parentTaskId === parentId);

    }

    getAllTasks() {

        return this.repository.getAll();

    }

    getTaskById(id) {

        return this.repository.getById(id);

    }

    updateTask(id, data) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        const nextRecurrence =
            data.recurrence !== undefined
                ? data.recurrence
                : (task.recurrence ?? null);

        if (
            nextRecurrence !== null &&
            (
                task.parentTaskId !== null ||
                this.getDescendants(id).length > 0
            )
        ) {
            throw new Error(
                "La recurrencia sólo puede aplicarse a tareas sin subtareas."
            );
        }

        task.update(data);

        this.repository.update(task);

        return task;

    }

    updateTasks(
        ids,
        data,
        {
            addTagIds = []
        } = {}
    ) {

        const uniqueIds = [
            ...new Set(ids)
        ];

        if (uniqueIds.length === 0) {
            throw new Error(
                "Seleccioná al menos una tarea."
            );
        }

        const tasks = uniqueIds.map(
            id => this.repository.getById(id)
        );

        if (tasks.some(task => !task)) {
            throw new Error(
                "Una de las tareas seleccionadas ya no existe."
            );
        }

        if (
            tasks.some(
                task => !this.isActiveTask(task)
            )
        ) {
            throw new Error(
                "Sólo se pueden editar en conjunto tareas activas."
            );
        }

        const updatedTasks = tasks.map(task => {

            const copy = new Task(
                task.toJSON()
            );

            const changes = {
                ...data
            };

            if (addTagIds.length > 0) {

                changes.tagIds = [
                    ...new Set([
                        ...copy.tagIds,
                        ...addTagIds
                    ])
                ];

            }

            copy.update(changes);

            return copy;

        });

        this.repository.updateMany(
            updatedTasks
        );

        return updatedTasks;

    }

    getBulkActiveTasks(ids) {

        const uniqueIds = [
            ...new Set(ids)
        ];

        if (uniqueIds.length === 0) {
            throw new Error(
                "Seleccioná al menos una tarea."
            );
        }

        const tasks = uniqueIds.map(
            id => this.repository.getById(id)
        );

        if (tasks.some(task => !task)) {
            throw new Error(
                "Una de las tareas seleccionadas ya no existe."
            );
        }

        if (
            tasks.some(
                task => !this.isActiveTask(task)
            )
        ) {
            throw new Error(
                "La acción masiva sólo admite tareas activas."
            );
        }

        return tasks;

    }

    validateSelectedTrees(tasks, action) {

        const selectedIds = new Set(
            tasks.map(task => task.id)
        );

        for (const task of tasks) {

            const missingDescendant =
                this.getDescendants(task.id)
                    .find(descendant =>
                        this.isActiveTask(descendant) &&
                        !selectedIds.has(
                            descendant.id
                        )
                    );

            if (missingDescendant) {
                throw new Error(
                    `Para ${action} una tarea principal, seleccioná también todas sus subtareas activas.`
                );
            }

        }

    }

    completeTasks(ids) {

        const tasks =
            this.getBulkActiveTasks(ids);

        this.validateSelectedTrees(
            tasks,
            "completar"
        );

        const completedTasks =
            tasks.map(task => {

                const copy = new Task(
                    task.toJSON()
                );

                copy.complete();

                return copy;

            });

        const replacements = new Map(
            completedTasks.map(
                task => [task.id, task]
            )
        );

        const nextRecurringTasks =
            completedTasks
                .filter(task => task.recurrence)
                .map(task => new Task({
                    title: task.title,
                    description: task.description,
                    status: TaskStatus.PENDING,
                    areaId: task.areaId,
                    contextId: task.contextId,
                    priority: task.priority,
                    tagIds: [...task.tagIds],
                    parentTaskId: null,
                    recurrenceId:
                        task.recurrenceId,
                    recurrence: task.recurrence,
                    dueDate:
                        getNextRecurrenceDate(
                            task.dueDate,
                            task.recurrence
                        )
                }));

        this.repository.replaceAll([
            ...this.repository
                .getAll()
                .map(task =>
                    replacements.get(task.id) ??
                    task
                ),
            ...nextRecurringTasks
        ]);

        return completedTasks;

    }

    archiveTasks(ids) {

        const tasks =
            this.getBulkActiveTasks(ids);

        this.validateSelectedTrees(
            tasks,
            "archivar"
        );

        const archivedTasks =
            tasks.map(task => {

                const copy = new Task(
                    task.toJSON()
                );

                copy.archive();

                return copy;

            });

        this.repository.updateMany(
            archivedTasks
        );

        return archivedTasks;

    }

    deleteTasks(ids) {

        const roots =
            this.getBulkActiveTasks(ids);

        const tasksById = new Map();

        for (const root of roots) {

            tasksById.set(root.id, root);

            for (
                const descendant of
                this.getDescendants(root.id)
            ) {
                tasksById.set(
                    descendant.id,
                    descendant
                );
            }

        }

        const deletedTasks = [
            ...tasksById.values()
        ].map(task => {

            const copy = new Task(
                task.toJSON()
            );

            copy.delete();

            return copy;

        });

        this.repository.updateMany(
            deletedTasks
        );

        return deletedTasks;

    }

    getTreesByState(
        ids,
        predicate,
        errorMessage
    ) {

        const uniqueIds = [
            ...new Set(ids)
        ];

        if (uniqueIds.length === 0) {
            throw new Error(
                "Seleccioná al menos una tarea."
            );
        }

        const roots = uniqueIds.map(
            id => this.repository.getById(id)
        );

        if (
            roots.some(
                task =>
                    !task ||
                    !predicate(task)
            )
        ) {
            throw new Error(errorMessage);
        }

        const tasksById = new Map();

        for (const root of roots) {

            tasksById.set(root.id, root);

            for (
                const descendant of
                this.getDescendants(root.id)
            ) {

                if (predicate(descendant)) {
                    tasksById.set(
                        descendant.id,
                        descendant
                    );
                }

            }

        }

        return [
            ...tasksById.values()
        ];

    }

    reopenCompletedTrees(ids) {

        const tasks = this.getTreesByState(
            ids,
            task =>
                task.isCompleted(),
            "Sólo se pueden reactivar tareas completadas."
        );

        if (
            tasks.some(task => task.recurrence)
        ) {
            throw new Error(
                "Las instancias recurrentes completadas no pueden reactivarse."
            );
        }

        const restored = tasks.map(task => {

            const copy = new Task(
                task.toJSON()
            );

            copy.reopen();

            return copy;

        });

        this.repository.updateMany(restored);

        return restored;

    }

    restoreArchivedTrees(ids) {

        const tasks = this.getTreesByState(
            ids,
            task =>
                task.isArchived(),
            "Sólo se pueden restaurar tareas archivadas."
        );

        const restored = tasks.map(task => {

            const copy = new Task(
                task.toJSON()
            );

            copy.restoreFromArchive();

            return copy;

        });

        this.repository.updateMany(restored);

        return restored;

    }

    restoreDeletedTrees(ids) {

        const tasks = this.getTreesByState(
            ids,
            task =>
                task.isDeleted(),
            "Sólo se pueden restaurar tareas de la papelera."
        );

        const restored = tasks.map(task => {

            const copy = new Task(
                task.toJSON()
            );

            copy.restoreFromTrash();

            return copy;

        });

        this.repository.updateMany(restored);

        return restored;

    }

    toggleTask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        if (task.isCompleted()) {

            if (task.recurrence) {
                throw new Error(
                    "No se puede reabrir una instancia recurrente completada. Editá la siguiente instancia."
                );
            }

            task.reopen();

        } else {

            if (this.hasActiveDescendants(id)) {
                throw new Error(
                    "Completá primero las subtareas pendientes."
                );
            }

            task.complete();

        }

        this.repository.update(task);

        if (task.isCompleted() && task.recurrence) {
            this.createNextRecurringTask(task);
        }

        return task;

    }

    createNextRecurringTask(task) {

        const nextDueDate = getNextRecurrenceDate(
            task.dueDate,
            task.recurrence
        );

        return this.repository.add({

            title: task.title,
            description: task.description,
            status: TaskStatus.PENDING,
            areaId: task.areaId,
            contextId: task.contextId,
            priority: task.priority,
            tagIds: [...task.tagIds],
            parentTaskId: null,
            recurrenceId: task.recurrenceId,
            recurrence: task.recurrence,
            dueDate: nextDueDate

        });

    }

    postponeTask(id, newDate) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        if (!this.isActiveTask(task)) {
            throw new Error(
                "Sólo se puede posponer una tarea activa."
            );
        }

        if (task.recurrence) {
            throw new Error(
                "Para una tarea recurrente, usá Saltear esta vez."
            );
        }

        task.postpone(newDate);
        this.repository.update(task);

        return task;

    }

    skipRecurringTask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        if (
            !this.isActiveTask(task) ||
            !task.recurrence
        ) {
            throw new Error(
                "Sólo se puede saltear una tarea recurrente activa."
            );
        }

        const nextDueDate = getNextRecurrenceDate(
            task.dueDate,
            task.recurrence
        );

        task.update({
            dueDate: nextDueDate
        });

        this.repository.update(task);

        return task;

    }

    archiveTask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        if (this.hasActiveDescendants(id)) {
            throw new Error(
                "No se puede archivar una tarea con subtareas activas."
            );
        }

        task.archive();

        this.repository.update(task);

        return task;

    }

    deleteTask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        const tree = [
            task,
            ...this.getDescendants(id)
        ];

        for (const item of tree) {
            item.delete();
            this.repository.update(item);
        }

        return task;

    }

    permanentlyDeleteTask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        if (task.status !== TaskStatus.DELETED) {
            throw new Error(
                "Sólo se puede eliminar definitivamente una tarea que esté en la papelera."
            );
        }

        const tree = [
            task,
            ...this.getDescendants(id)
        ];

        for (const item of [...tree].reverse()) {
            this.repository.remove(item.id);
        }

        return task;

    }

    restoreArchivedTask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        task.restoreFromArchive();

        this.repository.update(task);

        return task;

    }

    restoreDeletedTask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        const tree = [
            task,
            ...this.getDescendants(id)
        ];

        for (const item of tree) {

            if (item.isDeleted()) {
                item.restoreFromTrash();
                this.repository.update(item);
            }

        }

        return task;

    }

    getDescendants(parentId) {

        const tasks = this.repository.getAll();
        const descendants = [];
        const visited = new Set([parentId]);
        const pendingParentIds = [parentId];

        while (pendingParentIds.length > 0) {

            const currentParentId = pendingParentIds.shift();

            for (const task of tasks) {

                if (
                    task.parentTaskId === currentParentId &&
                    !visited.has(task.id)
                ) {

                    visited.add(task.id);
                    descendants.push(task);
                    pendingParentIds.push(task.id);

                }

            }

        }

        return descendants;

    }

    hasActiveDescendants(parentId) {

        return this
            .getDescendants(parentId)
            .some(task => this.isActiveTask(task));

    }

    hasTasksInArea(areaId) {

        return this.repository
            .getAll()
            .some(task => task.areaId === areaId);

    }

    hasTasksInContext(contextId) {

        return this.repository
            .getAll()
            .some(task => task.contextId === contextId);

    }

    hasTasksWithTag(tagId) {

        return this.repository
            .getAll()
            .some(task => task.tagIds.includes(tagId));

    }

    includeCompletedDescendants(tasks) {

        const allTasks = this.repository.getAll();
        const includedIds = new Set(
            tasks.map(task => task.id)
        );

        let changed = true;

        while (changed) {

            changed = false;

            for (const task of allTasks) {

                if (
                    task.status === TaskStatus.COMPLETED &&
                    includedIds.has(task.parentTaskId) &&
                    !includedIds.has(task.id)
                ) {

                    includedIds.add(task.id);
                    changed = true;

                }

            }

        }

        return allTasks.filter(
            task => includedIds.has(task.id)
        );

    }

    getInboxTasks() {

        return this.repository
            .getAll()
            .filter(task => task.status === TaskStatus.INBOX);

    }

    getTodayTasks(today) {

        return this.repository
            .getAll()
            .filter(task => {

                return (
                    this.isActiveTask(task) &&
                    task.dueDate !== null &&
                    task.dueDate <= today
                );

            });

    }

    getUpcomingTasks(today) {

        return this.repository
            .getAll()
            .filter(task => {

                return (
                    this.isActiveTask(task) &&
                    task.dueDate !== null &&
                    task.dueDate > today
                );

            });

    }

    getAllActiveTasks() {

        return this.repository
            .getAll()
            .filter(task => this.isActiveTask(task));

    }

    getCompletedTasks() {

        return this.repository
            .getAll()
            .filter(task => task.status === TaskStatus.COMPLETED);

    }

    getArchivedTasks() {

        return this.repository
            .getAll()
            .filter(task => task.status === TaskStatus.ARCHIVED);

    }

    getDeletedTasks() {

        return this.repository
            .getAll()
            .filter(task => task.status === TaskStatus.DELETED);

    }

    isActiveTask(task) {

        return (
            task.status !== TaskStatus.COMPLETED &&
            task.status !== TaskStatus.ARCHIVED &&
            task.status !== TaskStatus.DELETED
        );

    }

}
