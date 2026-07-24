import { Task } from "../domain/Task.js";

const STORAGE_KEY = "task-engine-v2";

export class TaskRepository {

    constructor() {

        this.tasks = [];

        this.load();

    }

    load() {

        const json = localStorage.getItem(STORAGE_KEY);

        if (!json) {
            return;
        }

        const data = JSON.parse(json);

        this.tasks = data.map(task => new Task(task));

    }

    save() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(this.tasks.map(task => task.toJSON()))
        );

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

        this.save();

        return task;

    }

    update(task) {

        const index = this.tasks.findIndex(t => t.id === task.id);

        if (index === -1) {
            throw new Error("La tarea no existe.");
        }

        this.tasks[index] = task;

        this.save();

    }

    remove(id) {

        this.tasks = this.tasks.filter(task => task.id !== id);

        this.save();

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

        this.save();

        return task;

    }



    replaceAll(tasks) {

        this.tasks = [...tasks];

        this.save();

    }

}
