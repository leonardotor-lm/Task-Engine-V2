import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { TaskList } from "../src/ui/TaskList.js";

class MemoryRepository {

    constructor(tasks) {
        this.tasks = tasks;
    }

    getById(id) {
        return this.tasks.find(
            task => task.id === id
        ) ?? null;
    }

    getAll() {
        return [...this.tasks];
    }

    replaceAll(tasks) {
        this.tasks = [...tasks];
    }

}

test("duplica un proyecto completo con relaciones nuevas", () => {

    const root = new Task({
        id: "root",
        title: "Proyecto escolar",
        areaId: "trabajo",
        contextId: "escuela",
        tagIds: ["urgente"],
        dueDate: "2026-08-10",
        postponements: [{
            from: "2026-08-01",
            to: "2026-08-10",
            date: "2026-07-25T00:00:00.000Z"
        }]
    });

    const child = new Task({
        id: "child",
        title: "Preparar materiales",
        parentTaskId: root.id,
        status: TaskStatus.COMPLETED
    });

    const grandchild = new Task({
        id: "grandchild",
        title: "Imprimir guías",
        parentTaskId: child.id
    });

    const repository =
        new MemoryRepository([
            root,
            child,
            grandchild
        ]);

    const service =
        new TaskService(repository);

    const result =
        service.duplicateTaskTree(root.id);

    assert.equal(result.tasks.length, 3);

    const [
        rootCopy,
        childCopy,
        grandchildCopy
    ] = result.tasks;

    assert.notEqual(rootCopy.id, root.id);
    assert.equal(
        rootCopy.title,
        "Copia de Proyecto escolar"
    );
    assert.equal(rootCopy.parentTaskId, null);
    assert.equal(rootCopy.isProject, true);

    assert.equal(
        childCopy.parentTaskId,
        rootCopy.id
    );
    assert.equal(childCopy.isProject, true);

    assert.equal(
        grandchildCopy.parentTaskId,
        childCopy.id
    );

    assert.ok(
        result.tasks.every(
            task =>
                task.status ===
                TaskStatus.PENDING
        )
    );

    assert.equal(rootCopy.areaId, "trabajo");
    assert.equal(rootCopy.contextId, "escuela");

    assert.deepEqual(
        rootCopy.tagIds,
        ["urgente"]
    );

    assert.equal(
        rootCopy.dueDate,
        "2026-08-10"
    );

    assert.deepEqual(
        rootCopy.postponements,
        []
    );

    assert.equal(repository.tasks.length, 6);

});

test("no permite duplicar una tarea recurrente", () => {

    const recurring = new Task({
        id: "recurring",
        title: "Rutina",
        dueDate: "2026-07-25",
        recurrence: "DAILY"
    });

    const service = new TaskService(
        new MemoryRepository([recurring])
    );

    assert.throws(
        () => service.duplicateTaskTree(
            recurring.id
        ),
        /recurrentes/
    );

});

test("muestra Duplicar sólo en tareas no recurrentes", () => {

    const ordinary = new Task({
        id: "ordinary",
        title: "Tarea común"
    });

    const recurring = new Task({
        id: "recurring-ui",
        title: "Rutina",
        dueDate: "2026-07-25",
        recurrence: "DAILY"
    });

    const ordinaryHtml =
        new TaskList().render(
            [ordinary],
            "Todas"
        );

    const recurringHtml =
        new TaskList().render(
            [recurring],
            "Todas"
        );

    assert.match(
        ordinaryHtml,
        /class="quickDuplicateTask"/
    );

    assert.doesNotMatch(
        recurringHtml,
        /class="quickDuplicateTask"/
    );

});
