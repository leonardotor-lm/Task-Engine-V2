import { TaskRepository } from "../infrastructure/TaskRepository.js";

export class TaskService {

    constructor() {
        this.repository = new TaskRepository();
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

    updateTask(task) {
        this.repository.update(task);
    }

    deleteTask(id) {
        this.repository.remove(id);
    }

}
