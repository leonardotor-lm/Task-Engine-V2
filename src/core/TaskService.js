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

    toggleTask(id) {
        return this.repository.toggleComplete(id);
    }

}
