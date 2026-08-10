import { TaskRepository } from "../infrastructure/TaskRepository.js";
import { Task } from "../domain/Task.js";
import { TaskStatus } from "../domain/TaskStatus.js";
import { getNextRecurrenceDate } from "../domain/Recurrence.js";
import {
    ActivityType
} from "../domain/ActivityEvent.js";

export class TaskService {

    constructor(
        repository = new TaskRepository(),
        activityService = null
    ) {

        this.repository = repository;
        this.activityService = activityService;

    }

    createTask(data) {

        const task = this.repository.add(data);

        this.activityService?.recordTask(
            ActivityType.TASK_CREATED,
            task
        );

        return task;

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

        const task = this.repository.add({
            title,
            parentTaskId: parent.id,
            areaId: parent.areaId,
            status: parent.status
        });

        this.activityService?.recordTask(
            ActivityType.TASK_CREATED,
            task,
            `Subtarea de ${parent.title}`
        );

        return task;

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

        const before = task.toJSON();
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

        const details = this.activityService
            ?.describeChanges(
                before,
                task.toJSON()
            );

        if (details) {
            this.activityService.recordTask(
                ActivityType.TASK_UPDATED,
                task,
                details
            );
        }

        return task;

    }

    addTaskAttachment(id, attachment) {

        const task = this.repository.getById(id);

        if (!task) return null;

        task.addAttachment(attachment);
        this.repository.update(task);

        this.activityService?.recordTask(
            ActivityType.ATTACHMENT_ADDED,
            task,
            attachment?.name
                ? `Adjunto: ${attachment.name}`
                : ""
        );

        return task;

    }

    removeTaskAttachment(
        id,
        attachmentId
    ) {

        const task = this.repository.getById(id);

        if (!task) return null;

        const removed = task.removeAttachment(
            attachmentId
        );

        if (!removed) return null;

        this.repository.update(task);

        this.activityService?.recordTask(
            ActivityType.ATTACHMENT_REMOVED,
            task,
            removed?.name
                ? `Adjunto: ${removed.name}`
                : ""
        );

        return removed;

    }

    removeGoalAssociations(goalIds) {

        const removedGoalIds = new Set(goalIds);

        if (removedGoalIds.size === 0) {
            return [];
        }

        const updatedTasks = this.repository
            .getAll()
            .filter(task =>
                (task.goalIds ?? []).some(
                    id => removedGoalIds.has(id)
                )
            )
            .map(task => {
                const copy = new Task(task.toJSON());
                copy.update({
                    goalIds: copy.goalIds.filter(
                        id => !removedGoalIds.has(id)
                    )
                });
                return copy;
            });

        if (updatedTasks.length > 0) {
            this.repository.updateMany(updatedTasks);
        }

        return updatedTasks;

    }

    removeMissingGoalAssociations(validGoalIds) {

        const existingGoalIds =
            new Set(validGoalIds);
        const missingGoalIds = new Set();

        for (const task of this.repository.getAll()) {
            for (const goalId of task.goalIds ?? []) {
                if (!existingGoalIds.has(goalId)) {
                    missingGoalIds.add(goalId);
                }
            }
        }

        return this.removeGoalAssociations(
            missingGoalIds
        );

    }

    updateTasks(
        ids,
        data,
        {
            addTagIds = [],
            addGoalIds = []
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

            if (addGoalIds.length > 0) {

                changes.goalIds = [
                    ...new Set([
                        ...copy.goalIds,
                        ...addGoalIds
                    ])
                ];

            }

            copy.update(changes);

            return copy;

        });

        this.repository.updateMany(
            updatedTasks
        );

        this.activityService?.recordTasks(
            ActivityType.TASK_UPDATED,
            updatedTasks,
            "Edición múltiple"
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
                    recurrenceInterval:
                        task.recurrenceInterval,
                    recurrenceWeekdays: [
                        ...task.recurrenceWeekdays
                    ],
                    dueDate:
                        getNextRecurrenceDate(
                            task.dueDate,
                            task.recurrence,
                            {
                                interval:
                                    task.recurrenceInterval,
                                weekdays:
                                    task.recurrenceWeekdays
                            }
                        ),
                    dueTime: task.dueTime
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

        this.activityService?.recordTasks(
            ActivityType.TASK_COMPLETED,
            completedTasks
        );

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

        this.activityService?.recordTasks(
            ActivityType.TASK_ARCHIVED,
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

        this.activityService?.recordTasks(
            ActivityType.TASK_TRASHED,
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

    permanentlyDeleteTasks(ids) {

        const tasks = this.getTreesByState(
            ids,
            task =>
                task.isDeleted(),
            "Sólo se pueden eliminar definitivamente tareas de la papelera."
        );

        for (
            const task of [...tasks].reverse()
        ) {
            this.repository.remove(task.id);
        }

        this.activityService?.recordTasks(
            ActivityType.TASK_DELETED,
            tasks
        );

        return tasks;

    }

    emptyTrash() {

        const tasks = this.getDeletedTasks();

        for (
            const task of [...tasks].reverse()
        ) {
            this.repository.remove(task.id);
        }

        this.activityService?.recordTasks(
            ActivityType.TASK_DELETED,
            tasks,
            "Papelera vaciada"
        );

        return tasks;

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

        this.activityService?.recordTasks(
            ActivityType.TASK_REOPENED,
            restored
        );

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

        this.activityService?.recordTasks(
            ActivityType.TASK_RESTORED,
            restored,
            "Restauradas desde Archivadas"
        );

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

        this.activityService?.recordTasks(
            ActivityType.TASK_RESTORED,
            restored,
            "Restauradas desde Papelera"
        );

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

        this.activityService?.recordTask(
            task.isCompleted()
                ? ActivityType.TASK_COMPLETED
                : ActivityType.TASK_REOPENED,
            task
        );

        if (task.isCompleted() && task.recurrence) {
            this.createNextRecurringTask(task);
        }

        return task;

    }

    createNextRecurringTask(task) {

        const nextDueDate = getNextRecurrenceDate(
            task.dueDate,
            task.recurrence,
            {
                interval:
                    task.recurrenceInterval,
                weekdays:
                    task.recurrenceWeekdays
            }
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
            recurrenceInterval:
                task.recurrenceInterval,
            recurrenceWeekdays: [
                ...task.recurrenceWeekdays
            ],
            dueDate: nextDueDate,
            dueTime: task.dueTime

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

        this.activityService?.recordTask(
            ActivityType.TASK_POSTPONED,
            task,
            `Nueva fecha: ${newDate}`
        );

        return task;

    }

    endRecurrence(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        if (
            !this.isActiveTask(task) ||
            !task.recurrence
        ) {
            throw new Error(
                "Sólo se puede finalizar una recurrencia activa."
            );
        }

        task.update({
            recurrence: null
        });

        this.repository.update(task);

        this.activityService?.recordTask(
            ActivityType.RECURRENCE_ENDED,
            task
        );

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
            task.recurrence,
            {
                interval:
                    task.recurrenceInterval,
                weekdays:
                    task.recurrenceWeekdays
            }
        );

        task.update({
            dueDate: nextDueDate
        });

        this.repository.update(task);

        this.activityService?.recordTask(
            ActivityType.RECURRENCE_SKIPPED,
            task,
            `Próxima fecha: ${nextDueDate}`
        );

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

        this.activityService?.recordTask(
            ActivityType.TASK_ARCHIVED,
            task
        );

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

        this.activityService?.recordTasks(
            ActivityType.TASK_TRASHED,
            tree
        );

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

        this.activityService?.recordTasks(
            ActivityType.TASK_DELETED,
            tree
        );

        return task;

    }

    restoreArchivedTask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        task.restoreFromArchive();

        this.repository.update(task);

        this.activityService?.recordTask(
            ActivityType.TASK_RESTORED,
            task,
            "Restaurada desde Archivadas"
        );

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

        this.activityService?.recordTasks(
            ActivityType.TASK_RESTORED,
            tree,
            "Restauradas desde Papelera"
        );

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

    duplicateTaskTree(id) {

        const root = this.repository.getById(id);

        if (!root) {
            return null;
        }

        if (!this.isActiveTask(root)) {
            throw new Error(
                "Sólo se puede duplicar una tarea activa."
            );
        }

        const sourceTasks = [
            root,
            ...this.getProjectDescendants(id)
        ];

        if (
            sourceTasks.some(
                task => task.recurrence
            )
        ) {
            throw new Error(
                "Las tareas recurrentes no pueden duplicarse."
            );
        }

        const copiesBySourceId = new Map();
        const copies = [];

        for (const source of sourceTasks) {

            const copiedParentId =
                source.id === root.id
                    ? null
                    : copiesBySourceId
                        .get(source.parentTaskId)
                        ?.id ?? null;

            const copy = new Task({
                title:
                    source.id === root.id
                        ? `Copia de ${source.title}`
                        : source.title,
                description: source.description,
                status: TaskStatus.PENDING,
                areaId: source.areaId,
                contextId: source.contextId,
                priority: source.priority,
                tagIds: [...source.tagIds],
                attachments:
                    source.attachments.map(
                        attachment => ({
                            ...attachment
                        })
                    ),
                parentTaskId: copiedParentId,
                recurrenceId: null,
                recurrence: null,
                manualOrder: source.manualOrder,
                dueDate: source.dueDate,
                dueTime: source.dueTime,
                postponements: []
            });

            copiesBySourceId.set(
                source.id,
                copy
            );

            copies.push(copy);

        }

        this.repository.replaceAll([
            ...this.repository.getAll(),
            ...copies
        ]);

        this.activityService?.recordTask(
            ActivityType.TASK_DUPLICATED,
            copies[0],
            `A partir de ${root.title}`
        );

        return {
            root: copies[0],
            tasks: copies
        };

    }

    moveTaskToProject(
        id,
        parentId
    ) {

        const task = this.repository.getById(id);
        const parent =
            this.repository.getById(parentId);

        if (!task || !parent) {
            throw new Error(
                "La tarea o el proyecto de destino no existe."
            );
        }

        if (
            !this.isActiveTask(task) ||
            !this.isActiveTask(parent)
        ) {
            throw new Error(
                "Sólo se pueden reorganizar tareas activas."
            );
        }

        if (task.id === parent.id) {
            throw new Error(
                "Una tarea no puede contenerse a sí misma."
            );
        }

        if (task.parentTaskId === parent.id) {
            throw new Error(
                "La tarea ya pertenece a ese proyecto."
            );
        }

        if (task.recurrence || parent.recurrence) {
            throw new Error(
                "Las tareas recurrentes no pueden formar parte de una jerarquía."
            );
        }

        if (
            this.getDescendants(task.id)
                .some(
                    descendant =>
                        descendant.id === parent.id
                )
        ) {
            throw new Error(
                "No se puede mover una tarea dentro de uno de sus descendientes."
            );
        }

        task.update({
            parentTaskId: parent.id
        });

        this.repository.update(task);

        this.activityService?.recordTask(
            ActivityType.TASK_MOVED,
            task,
            `Proyecto: ${parent.title}`
        );

        return task;

    }

    moveTasks(
        ids,
        parentId = null
    ) {

        const selectedIds = new Set(ids);
        const tasks = [...selectedIds].map(
            id => this.repository.getById(id)
        );

        if (tasks.some(task => !task)) {
            throw new Error(
                "Una de las tareas seleccionadas no existe."
            );
        }

        if (tasks.some(task => !this.isActiveTask(task))) {
            throw new Error(
                "Sólo se pueden mover tareas activas."
            );
        }

        if (tasks.some(task => task.recurrence)) {
            throw new Error(
                "Las tareas recurrentes no pueden formar parte de una jerarquía."
            );
        }

        let parent = null;

        if (parentId !== null) {
            parent = this.repository.getById(parentId);

            if (!parent || !this.isActiveTask(parent)) {
                throw new Error(
                    "El proyecto de destino no existe o no está activo."
                );
            }

            if (parent.recurrence) {
                throw new Error(
                    "Las tareas recurrentes no pueden formar parte de una jerarquía."
                );
            }

            if (
                selectedIds.has(parent.id) ||
                tasks.some(task =>
                    this.getDescendants(task.id)
                        .some(descendant => descendant.id === parent.id)
                )
            ) {
                throw new Error(
                    "No se puede mover la selección dentro de sí misma ni de sus descendientes."
                );
            }
        }

        const rootTasks = tasks.filter(task => {
            let current = task;
            const visited = new Set();

            while (current.parentTaskId) {
                if (selectedIds.has(current.parentTaskId)) {
                    return false;
                }
                if (visited.has(current.parentTaskId)) {
                    break;
                }
                visited.add(current.parentTaskId);
                current = this.repository.getById(
                    current.parentTaskId
                );
                if (!current) break;
            }

            return true;
        });

        rootTasks.forEach(task => {
            task.update({
                parentTaskId: parent?.id ?? null
            });
            this.repository.update(task);
        });

        this.activityService?.recordTasks(
            ActivityType.TASK_MOVED,
            rootTasks,
            parent
                ? `Proyecto: ${parent.title}`
                : "Convertidas en tareas principales"
        );

        return tasks;

    }

    detachSubtask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
        }

        if (!this.isActiveTask(task)) {
            throw new Error(
                "Sólo se puede independizar una tarea activa."
            );
        }

        if (!task.parentTaskId) {
            throw new Error(
                "La tarea ya es una tarea principal."
            );
        }

        task.update({
            parentTaskId: null
        });

        this.repository.update(task);

        this.activityService?.recordTask(
            ActivityType.TASK_MOVED,
            task,
            "Convertida en tarea principal"
        );

        return task;

    }

    getProjectDescendants(parentId) {

        const project =
            this.repository.getById(parentId);

        if (!project) {
            return [];
        }

        const descendants =
            this.getDescendants(parentId);

        if (project.isDeleted()) {

            return descendants.filter(
                task => task.isDeleted()
            );

        }

        if (project.isArchived()) {

            return descendants.filter(
                task => task.isArchived()
            );

        }

        return descendants.filter(
            task =>
                !task.isDeleted() &&
                !task.isArchived()
        );

    }

    getCompletableParentAfterTaskCompletion(taskId) {

        const task = this.repository.getById(taskId);

        if (
            !task ||
            !task.isCompleted() ||
            !task.parentTaskId
        ) {
            return null;
        }

        const parent = this.repository.getById(
            task.parentTaskId
        );

        if (
            !parent ||
            !this.isActiveTask(parent) ||
            this.hasActiveDescendants(parent.id)
        ) {
            return null;
        }

        return parent;

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
                    this.getOperationalDate(task) !== null &&
                    this.getOperationalDate(task) <= today
                );

            });

    }

    getTomorrowTasks(today) {

        const tomorrow =
            this.getDateAfterDays(today, 1);

        return this.repository
            .getAll()
            .filter(task => {

                return (
                    this.isActiveTask(task) &&
                    this.getOperationalDate(task) === tomorrow
                );

            });

    }

    getUpcomingTasks(today) {

        const startDate =
            this.getDateAfterDays(today, 2);
        const endDate =
            this.getDateAfterDays(today, 7);

        return this.repository
            .getAll()
            .filter(task => {

                return (
                    this.isActiveTask(task) &&
                    this.getOperationalDate(task) !== null &&
                    this.getOperationalDate(task) >= startDate &&
                    this.getOperationalDate(task) <= endDate
                );

            });

    }

    getOperationalDate(task) {

        return task.startDate ?? task.dueDate ?? null;

    }

    getDateAfterDays(dateString, days) {

        const date = new Date(
            `${dateString}T12:00:00Z`
        );

        date.setUTCDate(
            date.getUTCDate() + days
        );

        return date.toISOString().slice(0, 10);

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
