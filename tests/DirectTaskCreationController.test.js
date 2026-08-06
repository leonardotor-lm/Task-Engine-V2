import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Task } from "../src/domain/Task.js";
import { View } from "../src/core/View.js";
import {
    DirectTaskCreationController,
    isTaskCreationDraft
} from "../src/ui/DirectTaskCreationController.js";

function createApp(view = View.TODAY) {

    const created = [];
    let renders = 0;
    let delegatedUpdates = 0;

    const callbacks = {
        onOpenTaskCreation() {},
        onUpdateTask() {
            delegatedUpdates += 1;
        },
        onCloseTaskEditor() {}
    };

    const app = {
        currentView: view,
        currentAreaId: null,
        taskCreationOpen: false,
        projectTaskCreationOpen: false,
        inlineSubtaskParentId: null,
        bulkSelectionMode: true,
        selectedTaskIds: new Set(["task-1"]),
        selectedTask: null,
        mainView: {
            callbacks,
            render() {},
            async confirmDiscardTaskChanges() {
                return true;
            }
        },
        taskService: {
            createTask(data) {
                const task = new Task(data);
                created.push(task);
                return task;
            }
        },
        getTodayString() {
            return "2026-08-06";
        },
        render() {
            renders += 1;
        }
    };

    return {
        app,
        callbacks,
        created,
        get renders() {
            return renders;
        },
        get delegatedUpdates() {
            return delegatedUpdates;
        }
    };

}

function editorData(draft, title = "Preparar clase") {

    return {
        title,
        description: "",
        areaId: draft.areaId,
        contextId: draft.contextId,
        priority: draft.priority,
        dueDate: draft.dueDate,
        dueTime: draft.dueTime,
        tagIds: [],
        goalIds: [],
        recurrence: null,
        recurrenceInterval: 1,
        recurrenceWeekdays: []
    };

}

test("el botón de nueva tarea abre un borrador directamente en el editor", async () => {

    const context = createApp(View.TODAY);
    const controller =
        new DirectTaskCreationController(
            context.app,
            {
                documentRef: {
                    getElementById() {
                        return null;
                    }
                },
                windowRef: null
            }
        );

    controller.start();

    await context.callbacks
        .onOpenTaskCreation();

    const draft = context.app.selectedTask;

    assert.equal(
        isTaskCreationDraft(draft),
        true
    );
    assert.equal(draft.title, "");
    assert.equal(
        draft.dueDate,
        "2026-08-06"
    );
    assert.equal(
        context.app.taskCreationOpen,
        false
    );
    assert.equal(
        context.app.bulkSelectionMode,
        false
    );
    assert.equal(
        context.app.selectedTaskIds.size,
        0
    );
    assert.equal(context.created.length, 0);

});

test("guardar el borrador crea una sola tarea con todos los datos del editor", async () => {

    const context = createApp(View.TODAY);
    const controller =
        new DirectTaskCreationController(
            context.app,
            {
                documentRef: {
                    getElementById() {
                        return null;
                    }
                },
                windowRef: null
            }
        );

    controller.start();
    await context.callbacks
        .onOpenTaskCreation();

    const draft = context.app.selectedTask;

    context.callbacks.onUpdateTask(
        draft.id,
        editorData(draft)
    );

    assert.equal(context.created.length, 1);
    assert.equal(
        context.created[0].title,
        "Preparar clase"
    );
    assert.equal(
        context.created[0].dueDate,
        "2026-08-06"
    );
    assert.equal(
        context.app.selectedTask,
        null
    );

});

test("cerrar el borrador no crea una tarea residual", async () => {

    const context = createApp(View.ALL);
    const controller =
        new DirectTaskCreationController(
            context.app,
            {
                documentRef: {
                    getElementById() {
                        return null;
                    }
                },
                windowRef: null
            }
        );

    controller.start();
    await context.callbacks
        .onOpenTaskCreation();

    context.callbacks.onCloseTaskEditor();

    assert.equal(context.created.length, 0);
    assert.equal(
        context.app.selectedTask,
        null
    );

});

test("En espera conserva su valor predeterminado al crear desde esa vista", async () => {

    const context = createApp(View.WAITING);
    const controller =
        new DirectTaskCreationController(
            context.app,
            {
                documentRef: {
                    getElementById() {
                        return null;
                    }
                },
                windowRef: null
            }
        );

    controller.start();
    await context.callbacks
        .onOpenTaskCreation();

    const draft = context.app.selectedTask;

    assert.equal(draft.isWaiting, true);

    context.callbacks.onUpdateTask(
        draft.id,
        editorData(draft, "Tarea futura")
    );

    assert.equal(
        context.created[0].isWaiting,
        true
    );

});

test("la aplicación carga el controlador de creación directa", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );

    assert.match(
        main,
        /DirectTaskCreationController/
    );
    assert.match(
        main,
        /directTaskCreationController\.start\(\)/
    );

});
