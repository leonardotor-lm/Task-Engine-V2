import test from "node:test";
import assert from "node:assert/strict";

import {
    ActivityEvent,
    ActivityType
} from "../src/domain/ActivityEvent.js";
import {
    ActivityRepository
} from "../src/infrastructure/ActivityRepository.js";
import {
    ActivityService
} from "../src/core/ActivityService.js";
import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { ActivityView } from "../src/ui/ActivityView.js";
import {
    BACKUP_FORMAT,
    BACKUP_VERSION,
    BackupService
} from "../src/core/BackupService.js";

class MemoryStorage {
    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.get(key) ?? null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }
}

class MemoryTaskRepository {
    constructor(tasks = []) {
        this.tasks = [...tasks];
    }

    getAll() {
        return [...this.tasks];
    }

    getById(id) {
        return this.tasks.find(task =>
            task.id === id
        ) ?? null;
    }

    add(data) {
        const task = new Task(data);
        this.tasks.push(task);
        return task;
    }

    update(task) {
        const index = this.tasks.findIndex(item =>
            item.id === task.id
        );
        this.tasks[index] = task;
    }

    updateMany(tasks) {
        const replacements = new Map(
            tasks.map(task => [task.id, task])
        );
        this.tasks = this.tasks.map(task =>
            replacements.get(task.id) ?? task
        );
    }

    replaceAll(tasks) {
        this.tasks = [...tasks];
    }

    remove(id) {
        this.tasks = this.tasks.filter(task =>
            task.id !== id
        );
    }
}

class MemoryEntityRepository {
    constructor(items = []) {
        this.items = [...items];
    }

    getAll() {
        return [...this.items];
    }

    replaceAll(items) {
        this.items = [...items];
    }
}

function setup() {
    const storage = new MemoryStorage();
    const activityRepository =
        new ActivityRepository(storage);
    const activityService =
        new ActivityService(activityRepository);
    const taskRepository =
        new MemoryTaskRepository();
    const taskService = new TaskService(
        taskRepository,
        activityService
    );

    return {
        activityRepository,
        activityService,
        taskService
    };
}

test("valida y serializa una actividad", () => {
    const event = new ActivityEvent({
        id: "event-1",
        type: ActivityType.TASK_CREATED,
        taskId: "task-1",
        taskTitle: "Preparar clase",
        createdAt: "2026-08-10T14:30:00.000Z"
    });

    assert.equal(event.version, 1);
    assert.equal(
        event.toJSON().updatedAt,
        event.createdAt
    );
    assert.throws(
        () => new ActivityEvent({
            type: "UNKNOWN",
            taskTitle: "Tarea"
        }),
        /tipo de actividad/
    );
});

test("persiste y reconstruye el historial local", () => {
    const storage = new MemoryStorage();
    const repository =
        new ActivityRepository(storage);

    repository.add({
        id: "event-1",
        type: ActivityType.TASK_COMPLETED,
        taskId: "task-1",
        taskTitle: "Preparar clase",
        createdAt: "2026-08-10T14:30:00.000Z"
    });

    const restored =
        new ActivityRepository(storage);

    assert.equal(restored.getAll().length, 1);
    assert.equal(
        restored.getAll()[0].taskTitle,
        "Preparar clase"
    );
});

test("registra creación edición y finalización desde el servicio de tareas", () => {
    const {
        taskService,
        activityService
    } = setup();

    const task = taskService.createTask({
        id: "task-1",
        title: "Preparar clase"
    });

    taskService.updateTask(task.id, {
        title: "Preparar clase de Literatura",
        dueDate: "2026-08-12"
    });
    taskService.toggleTask(task.id);

    const events = activityService.getAllEvents();

    assert.deepEqual(
        events.map(event => event.type),
        [
            ActivityType.TASK_COMPLETED,
            ActivityType.TASK_UPDATED,
            ActivityType.TASK_CREATED
        ]
    );
    assert.match(
        events[1].details,
        /título.*vencimiento/
    );
});

test("resume una operación masiva en una sola entrada", () => {
    const {
        taskService,
        activityService
    } = setup();

    const first = taskService.createTask({
        id: "task-1",
        title: "Primera"
    });
    const second = taskService.createTask({
        id: "task-2",
        title: "Segunda"
    });

    taskService.completeTasks([
        first.id,
        second.id
    ]);

    const completion =
        activityService.getAllEvents()[0];

    assert.equal(
        completion.type,
        ActivityType.TASK_COMPLETED
    );
    assert.equal(completion.taskTitle, "2 tareas");
    assert.equal(completion.taskCount, 2);
});

test("filtra por categoría y busca por título", () => {
    const { activityService } = setup();

    activityService.repository.add({
        type: ActivityType.TASK_CREATED,
        taskTitle: "Preparar clase"
    });
    activityService.repository.add({
        type: ActivityType.TASK_ARCHIVED,
        taskTitle: "Comprar materiales"
    });

    assert.equal(
        activityService.search({
            category: "CREATION"
        }).length,
        1
    );
    assert.equal(
        activityService.search({
            query: "materiales"
        })[0].type,
        ActivityType.TASK_ARCHIVED
    );
});

test("la vista agrupa por fecha y enlaza tareas existentes", () => {
    const view = new ActivityView();
    const html = view.render({
        activityEvents: [
            new ActivityEvent({
                id: "event-1",
                type: ActivityType.TASK_CREATED,
                taskId: "task-1",
                taskTitle: "Preparar clase",
                createdAt:
                    "2026-08-10T14:30:00.000Z"
            })
        ],
        allTasks: [{ id: "task-1" }],
        activityQuery: "",
        activityCategory: "ALL",
        today: "2026-08-10"
    });

    assert.match(html, /<h2>\s*Hoy\s*<\/h2>/);
    assert.match(html, /openActivityTask/);
    assert.match(html, /Preparar clase/);
    assert.match(html, /activityCategory/);
    assert.match(
        html,
        /class="activityCategory"/
    );
    assert.match(
        html,
        /aria-label="Buscar en actividad"/
    );
    assert.match(
        html,
        /aria-label="Filtrar actividad"/
    );
    assert.doesNotMatch(html, /class="srOnly"/);
});

test("incluye actividades en copias y conserva las locales ante una copia antigua", () => {
    const storage = new MemoryStorage();
    const activityRepository =
        new ActivityRepository(storage);
    activityRepository.add({
        id: "event-local",
        type: ActivityType.TASK_CREATED,
        taskTitle: "Actividad local"
    });

    const backupService = new BackupService({
        taskRepository:
            new MemoryEntityRepository(),
        areaRepository:
            new MemoryEntityRepository(),
        contextRepository:
            new MemoryEntityRepository(),
        tagRepository:
            new MemoryEntityRepository(),
        activityRepository,
        storage
    });

    assert.equal(
        backupService.createBackup()
            .data.activityEvents.length,
        1
    );

    backupService.importBackup(JSON.stringify({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: []
        }
    }));

    assert.equal(
        activityRepository.getAll()[0].id,
        "event-local"
    );
});
