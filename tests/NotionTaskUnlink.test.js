import test from "node:test";
import assert from "node:assert/strict";
import { Dialog } from "../src/components/Dialog.js";
import {
    NotionTaskNotesController
} from "../src/ui/NotionTaskNotesController.js";

test("desmarca la página en Notion antes de quitar el vínculo local", async () => {

    const originalConfirm = Dialog.confirmAsync;
    Dialog.confirmAsync = async () => true;

    const task = {
        id: "task-1",
        title: "Preparar clase",
        status: "PENDING",
        isProject: false,
        areaId: null,
        contextId: null,
        tagIds: [],
        completedAt: null,
        notionPageId: "page-1",
        notionPageUrl: "https://www.notion.so/page-1"
    };
    const events = [];
    const app = {
        taskService: {
            getTaskById: () => task,
            updateTask: (id, data) => {
                events.push({ type: "local", data });
                Object.assign(task, data);
                return task;
            }
        },
        areaService: { getAreaById: () => null },
        contextService: { getContextById: () => null },
        tagService: { getTagById: () => null },
        syncConfig: {
            isConfigured: () => true,
            get: () => ({
                url: "https://example.test",
                token: "sync-token"
            })
        },
        syncEngine: {
            gateway: {
                updateNotionTaskPage: async data => {
                    events.push({ type: "remote", data });
                    return { ok: true, pageId: "page-1" };
                }
            }
        },
        selectedTask: task,
        render() {}
    };

    try {
        const controller = new NotionTaskNotesController(app, {
            documentRef: null,
            windowRef: null
        });

        await controller.unlink("task-1");

        assert.equal(events[0].type, "remote");
        assert.equal(events[0].data.task.linked, false);
        assert.equal(events[0].data.pageId, "page-1");
        assert.equal(events[1].type, "local");
        assert.deepEqual(events[1].data, {
            notionPageId: null,
            notionPageUrl: null
        });
    } finally {
        Dialog.confirmAsync = originalConfirm;
    }

});

test("conserva el vínculo local si Notion no puede marcar la página", async () => {

    const originalConfirm = Dialog.confirmAsync;
    Dialog.confirmAsync = async () => true;

    const task = {
        id: "task-1",
        title: "Preparar clase",
        status: "PENDING",
        isProject: false,
        areaId: null,
        contextId: null,
        tagIds: [],
        completedAt: null,
        notionPageId: "page-1",
        notionPageUrl: "https://www.notion.so/page-1"
    };
    let localUpdates = 0;
    const app = {
        taskService: {
            getTaskById: () => task,
            updateTask: () => {
                localUpdates += 1;
                return task;
            }
        },
        areaService: { getAreaById: () => null },
        contextService: { getContextById: () => null },
        tagService: { getTagById: () => null },
        syncConfig: {
            isConfigured: () => true,
            get: () => ({ url: "x", token: "y" })
        },
        syncEngine: {
            gateway: {
                updateNotionTaskPage: async () => {
                    throw new Error("Notion no disponible");
                }
            }
        },
        selectedTask: task,
        render() {}
    };

    try {
        const controller = new NotionTaskNotesController(app, {
            documentRef: null,
            windowRef: null
        });

        await controller.unlink("task-1");

        assert.equal(localUpdates, 0);
        assert.equal(task.notionPageId, "page-1");
        assert.match(
            controller.errorMessage,
            /No se pudo marcar la nota como desvinculada/
        );
    } finally {
        Dialog.confirmAsync = originalConfirm;
    }

});
