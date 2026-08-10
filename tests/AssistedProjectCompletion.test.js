import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";

function createService(tasks) {

    return new TaskService({
        getAll() {
            return tasks;
        },
        getById(id) {
            return tasks.find(
                task => task.id === id
            ) ?? null;
        }
    });

}

test("ofrece completar el padre al finalizar su última subtarea pendiente", () => {

    const parent = new Task({
        id: "project",
        title: "Proyecto"
    });
    const child = new Task({
        id: "child",
        title: "Última subtarea",
        parentTaskId: parent.id
    });

    child.complete();

    const service = createService([
        parent,
        child
    ]);

    assert.equal(
        service
            .getCompletableParentAfterTaskCompletion(
                child.id
            ),
        parent
    );

});

test("no ofrece el padre mientras quede una subtarea activa", () => {

    const parent = new Task({
        id: "project",
        title: "Proyecto"
    });
    const completedChild = new Task({
        id: "completed-child",
        title: "Terminada",
        parentTaskId: parent.id
    });
    const pendingChild = new Task({
        id: "pending-child",
        title: "Pendiente",
        parentTaskId: parent.id
    });

    completedChild.complete();

    const service = createService([
        parent,
        completedChild,
        pendingChild
    ]);

    assert.equal(
        service
            .getCompletableParentAfterTaskCompletion(
                completedChild.id
            ),
        null
    );

});

test("en una jerarquía ofrece sólo el padre directo que quedó sin pendientes", () => {

    const grandparent = new Task({
        id: "portfolio",
        title: "Proyecto superior"
    });
    const parent = new Task({
        id: "nested-project",
        title: "Proyecto hijo",
        parentTaskId: grandparent.id
    });
    const child = new Task({
        id: "nested-child",
        title: "Última subtarea",
        parentTaskId: parent.id
    });
    const grandparentSibling = new Task({
        id: "portfolio-task",
        title: "Otra tarea pendiente",
        parentTaskId: grandparent.id
    });

    child.complete();

    const service = createService([
        grandparent,
        parent,
        child,
        grandparentSibling
    ]);

    assert.equal(
        service
            .getCompletableParentAfterTaskCompletion(
                child.id
            ),
        parent
    );

});

test("no ofrece completar un padre al reabrir una subtarea", () => {

    const parent = new Task({
        id: "project",
        title: "Proyecto"
    });
    const child = new Task({
        id: "child",
        title: "Subtarea reabierta",
        parentTaskId: parent.id
    });

    const service = createService([
        parent,
        child
    ]);

    assert.equal(
        service
            .getCompletableParentAfterTaskCompletion(
                child.id
            ),
        null
    );

});

test("la interfaz pide confirmación explícita y evita cascadas", async () => {

    const mainView = await readFile(
        new URL(
            "../src/ui/MainView.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        mainView,
        /toggleTaskWithAssistedParentCompletion[\s\S]*?Dialog\.confirmAsync/
    );
    assert.match(
        mainView,
        /title:\s*"Completar proyecto"/
    );
    assert.match(
        mainView,
        /if \(completeParent\)[\s\S]*?this\.callbacks\.onToggleTask\([\s\S]*?parent\.id/
    );
    assert.doesNotMatch(
        mainView,
        /if \(completeParent\)[\s\S]*?toggleTaskWithAssistedParentCompletion\([\s\S]*?parent\.id/
    );

});

test("el gesto de completar espera la decisión asistida antes de mostrar deshacer", async () => {

    const swipeController = await readFile(
        new URL(
            "../src/ui/TaskSwipeController.js",
            import.meta.url
        ),
        "utf8"
    );
    const roadmap = await readFile(
        new URL(
            "../docs/roadmap/PENDIENTES.md",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        swipeController,
        /typeof completed\.then[\s\S]*?completed\.then\(succeeded/
    );
    assert.doesNotMatch(
        roadmap,
        /### Finalización asistida de proyectos/
    );
    assert.match(
        roadmap,
        /\*\*Finalización asistida de proyectos:\*\*/
    );

});
