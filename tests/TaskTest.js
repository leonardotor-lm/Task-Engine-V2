import { Task } from "../domain/Task.js";
import { Priority } from "../domain/Priority.js";

export function runTaskTests() {

    console.group("=== TASK TESTS ===");

    const task = new Task({

        title: "Preparar clase de Literatura",

        description: "Leer los cuentos y preparar actividades.",

        priority: Priority.HIGH,

        dueDate: "2026-07-20"

    });

    console.log("1. Tarea creada");
    console.log(task);

    task.complete();

    console.log("2. Tarea completada");
    console.log(task);

    task.postpone("2026-07-25");

    console.log("3. Tarea pospuesta");
    console.log(task);

    task.restore();

    console.log("4. Tarea restaurada");
    console.log(task);

    console.log("5. JSON");
    console.log(task.toJSON());

    console.groupEnd();

}