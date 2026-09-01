import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
    new URL(
        "../google-apps-script/GptActions.gs",
        import.meta.url
    ),
    "utf8"
);
const coreSource = readFileSync(
    new URL(
        "../google-apps-script/Code.gs",
        import.meta.url
    ),
    "utf8"
);

function task(overrides = {}) {
    return {
        id: "task-1",
        title: "Preparar clase",
        description: "Literatura fantástica",
        status: "PENDING",
        statusBeforeDelete: null,
        statusBeforeCompletion: null,
        isWaitingBeforeCompletion: null,
        areaId: "area-1",
        contextId: "context-1",
        priority: 3,
        tagIds: [],
        goalIds: [],
        attachments: [],
        notionPageId: null,
        notionPageUrl: null,
        isWaiting: false,
        isProject: false,
        parentTaskId: null,
        recurrenceId: null,
        recurrence: null,
        recurrenceInterval: 1,
        recurrenceWeekdays: [],
        reminder: null,
        manualOrder: 0,
        version: 1,
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-01T10:00:00.000Z",
        completedAt: null,
        startDate: null,
        dueDate: "2026-09-03",
        dueTime: null,
        postponements: [],
        ...overrides
    };
}

function backup() {
    return {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt: "2026-09-01T10:00:00.000Z",
        data: {
            tasks: [task()],
            areas: [{
                id: "area-1",
                name: "Docencia",
                color: "#336699",
                version: 1
            }],
            contexts: [{
                id: "context-1",
                name: "Escuela",
                color: "#663399",
                version: 1
            }],
            tags: [],
            goals: [],
            customFilters: [],
            activityEvents: [],
            taskSortPreferences: {},
            taskFilterPreferences: {},
            displayPreferences: {}
        }
    };
}

function loadBackend() {

    let snapshot = backup();
    let revision = 4;
    let uuid = 0;
    const cache = new Map();
    const context = {
        console,
        Utilities: {
            getUuid: () => `generated-${++uuid}`,
            DigestAlgorithm: { SHA_256: "SHA_256" },
            computeDigest: (_algorithm, value) =>
                [...Buffer.from(value)],
            base64EncodeWebSafe: value =>
                Buffer.from(value).toString("base64url")
        },
        CacheService: {
            getScriptCache: () => ({
                get: key => cache.get(key) ?? null,
                put: (key, value) => cache.set(key, value)
            })
        }
    };

    vm.createContext(context);
    vm.runInContext(coreSource, context);
    vm.runInContext(source, context);

    context.loadSnapshot_ = () => ({
        ok: true,
        revision,
        data: structuredClone(snapshot)
    });
    context.saveSnapshot_ = (next, baseRevision) => {
        assert.equal(baseRevision, revision);
        context.validateSnapshot_(next);
        snapshot = structuredClone(next);
        revision += 1;
        return { ok: true, revision };
    };

    return {
        context,
        getSnapshot: () => structuredClone(snapshot)
    };

}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test("consulta contexto y busca tareas sin exponer vínculos privados", () => {
    const { context } = loadBackend();
    const organization = plain(context.gptGetContext_());
    const result = plain(context.gptSearchTasks_({
        query: "fantastica",
        status: "PENDING"
    }));

    assert.equal(organization.counts.PENDING, 1);
    assert.equal(organization.areas[0].name, "Docencia");
    assert.equal(result.total, 1);
    assert.equal(result.tasks[0].id, "task-1");
    assert.equal(
        Object.hasOwn(result.tasks[0], "notionPageUrl"),
        false
    );
    assert.equal(
        Object.hasOwn(result.tasks[0], "attachments"),
        false
    );
});

test("crea una tarea una sola vez ante el mismo requestId", () => {
    const backend = loadBackend();
    const input = {
        requestId: "request-create-1234567890",
        title: "Corregir evaluaciones",
        areaId: "area-1",
        dueDate: "2026-09-05"
    };

    const first = plain(
        backend.context.gptCreateTask_(input)
    );
    const repeated = plain(
        backend.context.gptCreateTask_(input)
    );

    assert.deepEqual(repeated, first);
    assert.equal(
        backend.getSnapshot().data.tasks.length,
        2
    );
    assert.equal(first.task.status, "PENDING");
});

test("rechaza fechas inexistentes aunque tengan formato ISO", () => {
    const { context } = loadBackend();

    assert.throws(
        () => context.gptCreateTask_({
            requestId: "request-invalid-date-1234567890",
            title: "Fecha imposible",
            dueDate: "2026-02-30"
        }),
        error => error.code === "INVALID_DATE"
    );
});

test("edita y completa sólo la versión vigente", () => {
    const backend = loadBackend();
    const updated = plain(
        backend.context.gptUpdateTask_({
            requestId: "request-update-1234567890",
            taskId: "task-1",
            expectedVersion: 1,
            changes: {
                title: "Preparar clase de fantástico",
                priority: 4
            }
        })
    );

    assert.equal(updated.task.version, 2);
    assert.equal(updated.task.priority, 4);

    assert.throws(
        () => backend.context.gptCompleteTask_({
            requestId: "request-stale-1234567890",
            taskId: "task-1",
            expectedVersion: 1
        }),
        error => error.code ===
            "TASK_VERSION_CONFLICT"
    );

    const completed = plain(
        backend.context.gptCompleteTask_({
            requestId: "request-complete-1234567890",
            taskId: "task-1",
            expectedVersion: 2
        })
    );

    assert.equal(completed.task.status, "COMPLETED");
    assert.equal(completed.task.version, 3);

    assert.throws(
        () => backend.context.gptUpdateTask_({
            requestId: "request-edit-completed-1234567890",
            taskId: "task-1",
            expectedVersion: 3,
            changes: { title: "No permitido" }
        }),
        error => error.code === "TASK_NOT_ACTIVE"
    );
});
