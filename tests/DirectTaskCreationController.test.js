import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { View } from "../src/core/View.js";
import {
    DirectTaskCreationController,
    isTaskCreationDraft,
    isSubtaskCreationDraft
} from "../src/ui/DirectTaskCreationController.js";

function createAttachment(overrides = {}) {

    return {
        id: "attachment-1",
        driveFileId: "drive-file-1",
        name: "planificacion.pdf",
        mimeType: "application/pdf",
        size: 1024,
        url:
            "https://drive.google.com/file/d/drive-file-1/view",
        createdAt: "2026-08-06T20:00:00.000Z",
        ...overrides
    };

}

function createApp(
    view = View.TODAY,
    initialTasks = []
) {

    const created = [];
    const trashed = [];
    const tasks = [...initialTasks];
    let renders = 0;
    let delegatedUpdates = 0;

    const callbacks = {
        onOpenTaskCreation() {},
        onOpenProjectTaskCreation() {},
        onUpdateTask() {
            delegatedUpdates += 1;
        },
        onCloseTaskEditor() {}
    };

    const app = {
        currentView: view,
        currentAreaId: null,
        projectTaskId: null,
        taskCreationOpen: false,
        projectTaskCreationOpen: false,
        inlineSubtaskParentId: null,
        bulkSelectionMode: true,
        selectedTaskIds: new Set(["task-1"]),
        expandedTaskIds: new Set(),
        selectedTask: null,
        selectedGoal: null,
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
                tasks.push(task);
                created.push(task);
                return task;
            },
            getTaskById(id) {
                return tasks.find(
                    task => task.id === id
                ) ?? null;
            },
            isActiveTask(task) {
                return (
                    task.status !== TaskStatus.COMPLETED &&
                    task.status !== TaskStatus.ARCHIVED &&
                    task.status !== TaskStatus.DELETED
                );
            }
        },
        syncConfig: {
            isConfigured() {
                return true;
            },
            get() {
                return {
                    endpoint: "https://example.invalid",
                    token: "test-token"
                };
            }
        },
        syncEngine: {
            gateway: {
                async trashAttachment({
                    driveFileId
                }) {
                    trashed.push(driveFileId);
                }
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
        tasks,
        trashed,
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
    assert.equal(
        isSubtaskCreationDraft(draft),
        false
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

test("los adjuntos del borrador se conservan al crear la tarea", async () => {

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

    const draft = context.app.selectedTask;
    draft.addAttachment(createAttachment());

    context.callbacks.onUpdateTask(
        draft.id,
        editorData(draft, "Tarea con archivo")
    );

    assert.equal(
        context.created[0].attachments.length,
        1
    );
    assert.equal(
        context.created[0]
            .attachments[0]
            .driveFileId,
        "drive-file-1"
    );
    assert.deepEqual(context.trashed, []);

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

test("cancelar un borrador envía sus adjuntos a la papelera de Drive", async () => {

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

    context.app.selectedTask.addAttachment(
        createAttachment()
    );

    await context.callbacks
        .onCloseTaskEditor();

    assert.deepEqual(
        context.trashed,
        ["drive-file-1"]
    );
    assert.equal(
        context.app.selectedTask,
        null
    );
    assert.equal(context.created.length, 0);

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

test("Agregar subtarea en PROJECT abre directamente un borrador en el editor", async () => {

    const parent = new Task({
        id: "project",
        title: "Proyecto",
        status: TaskStatus.PENDING,
        areaId: "area-1"
    });
    const context = createApp(
        View.PROJECT,
        [parent]
    );
    context.app.projectTaskId = parent.id;

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
        .onOpenProjectTaskCreation();

    const draft = context.app.selectedTask;

    assert.equal(
        isSubtaskCreationDraft(draft),
        true
    );
    assert.equal(draft.title, "");
    assert.equal(
        draft.parentTaskId,
        parent.id
    );
    assert.equal(draft.areaId, parent.areaId);
    assert.equal(draft.status, parent.status);
    assert.equal(
        context.app.projectTaskCreationOpen,
        false
    );
    assert.equal(context.created.length, 0);

});

test("guardar una subtarea desde el editor persiste todos sus datos una sola vez", async () => {

    const parent = new Task({
        id: "project",
        title: "Proyecto",
        status: TaskStatus.PENDING,
        areaId: "area-1"
    });
    const context = createApp(
        View.PROJECT,
        [parent]
    );
    context.app.projectTaskId = parent.id;

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
        .onOpenProjectTaskCreation();

    const draft = context.app.selectedTask;
    draft.addAttachment(createAttachment());

    context.callbacks.onUpdateTask(
        draft.id,
        {
            ...editorData(
                draft,
                "Primera etapa"
            ),
            description: "Descripción completa",
            contextId: "context-1",
            priority: 3,
            dueDate: "2026-08-20",
            dueTime: "18:30",
            tagIds: ["tag-1"],
            goalIds: ["goal-1"]
        }
    );

    assert.equal(context.created.length, 1);

    const subtask = context.created[0];

    assert.equal(subtask.title, "Primera etapa");
    assert.equal(
        subtask.parentTaskId,
        parent.id
    );
    assert.equal(
        subtask.description,
        "Descripción completa"
    );
    assert.equal(subtask.areaId, "area-1");
    assert.equal(subtask.contextId, "context-1");
    assert.equal(subtask.priority, 3);
    assert.equal(subtask.dueDate, "2026-08-20");
    assert.equal(subtask.dueTime, "18:30");
    assert.deepEqual(subtask.tagIds, ["tag-1"]);
    assert.deepEqual(subtask.goalIds, ["goal-1"]);
    assert.equal(subtask.attachments.length, 1);
    assert.equal(context.app.currentView, View.PROJECT);
    assert.ok(
        context.app.expandedTaskIds.has(parent.id)
    );
    assert.equal(context.app.selectedTask, null);

});

test("cancelar la creación de una subtarea no deja tareas residuales", async () => {

    const parent = new Task({
        id: "project",
        title: "Proyecto",
        status: TaskStatus.PENDING
    });
    const context = createApp(
        View.PROJECT,
        [parent]
    );
    context.app.projectTaskId = parent.id;

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
        .onOpenProjectTaskCreation();

    context.callbacks.onCloseTaskEditor();

    assert.equal(context.created.length, 0);
    assert.equal(context.tasks.length, 1);
    assert.equal(context.app.selectedTask, null);
    assert.equal(
        context.app.projectTaskCreationOpen,
        false
    );

});

test("una subtarea INBOX pasa a PENDING si se le asigna un área antes de crearla", async () => {

    const parent = new Task({
        id: "inbox-project",
        title: "Proyecto Inbox",
        status: TaskStatus.INBOX
    });
    const context = createApp(
        View.PROJECT,
        [parent]
    );
    context.app.projectTaskId = parent.id;

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
        .onOpenProjectTaskCreation();

    const draft = context.app.selectedTask;

    context.callbacks.onUpdateTask(
        draft.id,
        {
            ...editorData(
                draft,
                "Subtarea organizada"
            ),
            areaId: "area-2"
        }
    );

    assert.equal(
        context.created[0].status,
        TaskStatus.PENDING
    );
    assert.equal(
        context.created[0].areaId,
        "area-2"
    );

});

test("la aplicación carga el controlador de creación directa y conserva la sección de adjuntos", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const creation = await readFile(
        new URL(
            "../src/ui/DirectTaskCreationController.js",
            import.meta.url
        ),
        "utf8"
    );
    const attachments = await readFile(
        new URL(
            "../src/ui/AttachmentController.js",
            import.meta.url
        ),
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
    assert.match(
        creation,
        /onOpenProjectTaskCreation/
    );
    assert.match(
        creation,
        /taskCreationKind === "subtask"/
    );
    assert.match(
        creation,
        /attachments:\s*\[/
    );
    assert.doesNotMatch(
        creation,
        /"\.editorAttachmentsSection"/
    );
    assert.match(
        attachments,
        /isTaskCreationDraft/
    );
    assert.match(
        attachments,
        /task\.addAttachment\(attachment\)/
    );
    assert.match(
        attachments,
        /refreshSection\(task\)/
    );

});
