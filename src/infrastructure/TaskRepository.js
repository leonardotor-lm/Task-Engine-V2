import { Task } from "../domain/Task.js";

export class TaskRepository {

    constructor() {
        this.tasks = [];
    }

    getAll() {
        return [...this.tasks];
    }

    getById(id) {
        return this.tasks.find(task => task.id === id) ?? null;
    }

    add(taskData) {

        const task = new Task(taskData);

        this.tasks.push(task);

        return task;
    }

    update(task) {

        const index = this.tasks.findIndex(t => t.id === task.id);

        if (index === -1) {
            throw new Error("La tarea no existe.");
        }

        this.tasks[index] = task;
    }

    remove(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
    }

    toggleComplete(id) {

        const task = this.getById(id);

        if (!task) {
            return null;
        }

        if (task.status === "COMPLETED") {
            task.restore();
        } else {
            task.complete();
        }

        return task;
    }

}
