import { TaskRepository } from "../infrastructure/TaskRepository.js";

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

}