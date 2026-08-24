import test from "node:test";
import assert from "node:assert/strict";
import { Task } from "../src/domain/Task.js";
import {
    applyAtomicTaskUpdates
} from "../src/core/AtomicTaskUpdates.js";
import {
    createSubtasksAtomically,
    createTasksAtomically
} from "../src/core/AtomicTaskCreations.js";
import {
    AiTransactionalWritesController
} from "../src/ui/AiTransactionalWritesController.js";

function createFailingRepository(tasks) {
    return {
        tasks: [...tasks],
        failNextReplace: true,
        getAll() {
            return [...this.tasks];
        },
        getById(id) {
            return this.tasks.find(task => task.id === id) ?? null;
        },
        replaceAll(nextTasks) {
            this.tasks = [...nextTasks];
            if (this.failNextReplace) {
                this.failNextReplace = false;
                throw new Error("fallo simulado de persistencia");
            }
        }
    };
}

function createActivityService() {
    return {
        events: [],
        recordTask(type, task, details = "") {
            this.events.push({
                type,
                taskId: task.id,
                details
            });
        }
    };
}

test("revierte toda la captura de tareas si falla la persistencia", () => {
    const original = new Task({
        id: "original",
        title: "Existente",
        status: "PENDING"
    });
    const repository = createFailingRepository([original]);
    const activityService = createActivityService();
    const taskService = {
        repository,
        activityService
    };

    assert.throws(
        () => createTasksAtomically(taskService, [
            { title: "Primera" },
            { title: "Segunda" }
        ]),
        /fallo simulado/
    );

    assert.deepEqual(
        repository.getAll().map(task => task.id),
        ["original"]
    );
    assert.equal(activityService.events.length, 0);
});

test("revierte proyecto y subtareas si falla la persistencia", () => {
    const parent = new Task({
        id: "parent",
        title: "Organizar mudanza",
        status: "PENDING",
        isProject: false
    });
    const repository = createFailingRepository([parent]);
    const activityService = createActivityService();
    const taskService = {
        repository,
        activityService,
        isActiveTask: () => true
    };

    assert.throws(
        () => createSubtasksAtomically(taskService, [{
            parentId: "parent",
            titles: ["Preparar cajas", "Coordinar traslado"]
        }]),
        /fallo simulado/
    );

    assert.equal(repository.getAll().length, 1);
    assert.equal(repository.getById("parent").isProject, false);
    assert.equal(activityService.events.length, 0);
});

test("una actualización atómica de organización notifica el puente de Notion", () => {
    const task = new Task({
        id: "task-1",
        title: "Preparar clase",
        status: "PENDING",
        areaId: null,
        notionPageId: "page-1",
        notionPageUrl: "https://www.notion.so/page-1"
    });
    const repository = {
        tasks: [task],
        getAll() {
            return [...this.tasks];
        },
        getById(id) {
            return this.tasks.find(item => item.id === id) ?? null;
        },
        updateMany(nextTasks) {
            const replacements = new Map(
                nextTasks.map(item => [item.id, item])
            );
            this.tasks = this.tasks.map(item =>
                replacements.get(item.id) ?? item
            );
        },
        replaceAll(nextTasks) {
            this.tasks = [...nextTasks];
        }
    };
    const taskService = {
        repository,
        activityService: {
            describeChanges: () => "Cambio",
            recordTask() {}
        },
        getAllTasks: () => repository.getAll()
    };
    let syncedBefore = null;
    const notionTaskNotesController = {
        getSyncFingerprint(value) {
            return JSON.stringify({
                areaId: value.areaId ?? null
            });
        },
        syncChangedLinkedTasks(before) {
            syncedBefore = before;
        }
    };
    const bridge = new AiTransactionalWritesController(
        { taskService },
        { notionTaskNotesController }
    );
    bridge.start();

    applyAtomicTaskUpdates(taskService, [{
        id: "task-1",
        changes: { areaId: "area-1" }
    }]);

    assert.ok(syncedBefore instanceof Map);
    assert.equal(
        syncedBefore.get("task-1"),
        JSON.stringify({ areaId: null })
    );
    assert.equal(
        repository.getById("task-1").areaId,
        "area-1"
    );
});

test("la creación atómica de subtareas notifica el cambio isProject del padre", () => {
    const parent = new Task({
        id: "parent",
        title: "Organizar mudanza",
        status: "PENDING",
        isProject: false,
        notionPageId: "page-1",
        notionPageUrl: "https://www.notion.so/page-1"
    });
    const repository = {
        tasks: [parent],
        getAll() {
            return [...this.tasks];
        },
        getById(id) {
            return this.tasks.find(item => item.id === id) ?? null;
        },
        replaceAll(nextTasks) {
            this.tasks = [...nextTasks];
        }
    };
    const taskService = {
        repository,
        activityService: createActivityService(),
        isActiveTask: () => true,
        getAllTasks: () => repository.getAll()
    };
    let syncedBefore = null;
    const notionTaskNotesController = {
        getSyncFingerprint(value) {
            return JSON.stringify({
                isProject: value.isProject === true
            });
        },
        syncChangedLinkedTasks(before) {
            syncedBefore = before;
        }
    };
    const bridge = new AiTransactionalWritesController(
        { taskService },
        { notionTaskNotesController }
    );
    bridge.start();

    const created = createSubtasksAtomically(
        taskService,
        [{
            parentId: "parent",
            titles: ["Preparar cajas", "Coordinar traslado"]
        }]
    );

    assert.equal(created.length, 2);
    assert.equal(repository.getById("parent").isProject, true);
    assert.equal(
        syncedBefore.get("parent"),
        JSON.stringify({ isProject: false })
    );
});
