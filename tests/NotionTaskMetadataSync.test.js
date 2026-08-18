import test from "node:test";
import assert from "node:assert/strict";
import {
    NotionTaskNotesController
} from "../src/ui/NotionTaskNotesController.js";

test("sincroniza una tarea vinculada cuando cambia metadata relevante", async () => {

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
    const calls = [];

    const taskService = {
        getAllTasks: () => [task],
        updateTask: (id, data) => {
            Object.assign(task, data);
            return task;
        }
    };
    const app = {
        taskService,
        mainView: {
            render() {}
        },
        areaService: {
            getAreaById: id =>
                id === "area-1"
                    ? { name: "Trabajo" }
                    : null
        },
        contextService: {
            getContextById: id =>
                id === "context-1"
                    ? { name: "PC" }
                    : null
        },
        tagService: {
            getTagById: id =>
                id === "tag-1"
                    ? { name: "Literatura" }
                    : null
        },
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
                    calls.push(data);
                    return {
                        ok: true,
                        pageId: "page-1"
                    };
                }
            }
        },
        selectedTask: null,
        render() {}
    };

    const controller =
        new NotionTaskNotesController(app, {
            documentRef: null,
            windowRef: null
        });

    controller.start();

    taskService.updateTask("task-1", {
        title: "Preparar clase actualizada",
        areaId: "area-1",
        contextId: "context-1",
        tagIds: ["tag-1"]
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    assert.equal(calls.length, 1);
    assert.equal(calls[0].pageId, "page-1");
    assert.equal(
        calls[0].task.title,
        "Preparar clase actualizada"
    );
    assert.equal(calls[0].task.areaName, "Trabajo");
    assert.deepEqual(calls[0].task.contextNames, ["PC"]);
    assert.deepEqual(calls[0].task.tagNames, ["Literatura"]);

});

test("no sincroniza al desvincular porque la página queda independiente", async () => {

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
    let calls = 0;
    const taskService = {
        getAllTasks: () => [task],
        updateTask: (id, data) => {
            Object.assign(task, data);
            return task;
        }
    };
    const app = {
        taskService,
        mainView: { render() {} },
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
                    calls += 1;
                }
            }
        },
        selectedTask: null,
        render() {}
    };

    const controller =
        new NotionTaskNotesController(app, {
            documentRef: null,
            windowRef: null
        });
    controller.start();

    taskService.updateTask("task-1", {
        notionPageId: null,
        notionPageUrl: null
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    assert.equal(calls, 0);

});
