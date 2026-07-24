import { TaskRepository } from "../infrastructure/TaskRepository.js";
import { TaskStatus } from "../domain/TaskStatus.js";

export class TaskService {

    constructor(repository = new TaskRepository()) {

        this.repository = repository;

    }

    createTask(data) {

        return this.repository.add(data);

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

        task.update(data);

        this.repository.update(task);

        return task;

    }

    toggleTask(id) {

        return this.repository.toggleComplete(id);

    }

    archiveTask(id) {

        const task = this.repository.getById(id);

        if (!task) {
            return null;
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

        task.delete();

        this.repository.update(task);

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

        this.repository.remove(id);

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

        task.restoreFromTrash();

        this.repository.update(task);

        return task;

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