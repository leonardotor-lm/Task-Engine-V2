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

    isActiveTask(task) {

        return (
            task.status !== TaskStatus.COMPLETED &&
            task.status !== TaskStatus.ARCHIVED &&
            task.status !== TaskStatus.DELETED
        );

    }

}