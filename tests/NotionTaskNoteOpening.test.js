import test from "node:test";
import assert from "node:assert/strict";
import {
    NotionTaskNotesController
} from "../src/ui/NotionTaskNotesController.js";

test("abre la nota recién creada sólo después de recibir su URL", async () => {

    const openedUrls = [];
    const windowRef = {
        open: (...args) => {
            openedUrls.push(args);
            return {};
        }
    };
    const task = {
        id: "task-1",
        title: "Preparar clase",
        status: "PENDING",
        isProject: false,
        areaId: null,
        contextId: null,
        tagIds: [],
        completedAt: null,
        notionPageId: null,
        notionPageUrl: null,
        isDeleted: () => false
    };
    let updatedData = null;

    const app = {
        taskService: {
            getTaskById: () => task,
            updateTask: (id, data) => {
                updatedData = data;
                return {
                    ...task,
                    ...data
                };
            }
        },
        areaService: {
            getAreaById: () => null
        },
        contextService: {
            getContextById: () => null
        },
        tagService: {
            getTagById: () => null
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
                createNotionTaskPage: async () => ({
                    ok: true,
                    pageId: "page-1",
                    pageUrl:
                        "https://www.notion.so/page-1"
                })
            }
        },
        render() {}
    };

    const controller =
        new NotionTaskNotesController(app, {
            documentRef: null,
            windowRef
        });

    await controller.create("task-1");

    assert.deepEqual(openedUrls, [[
        "https://www.notion.so/page-1",
        "_blank",
        "noopener,noreferrer"
    ]]);
    assert.deepEqual(updatedData, {
        notionPageId: "page-1",
        notionPageUrl:
            "https://www.notion.so/page-1"
    });

});

test("no abre ninguna pestaña cuando falla la creación", async () => {

    const openedUrls = [];
    const task = {
        id: "task-1",
        title: "Preparar clase",
        status: "PENDING",
        isProject: false,
        areaId: null,
        contextId: null,
        tagIds: [],
        completedAt: null,
        notionPageId: null,
        notionPageUrl: null,
        isDeleted: () => false
    };
    const app = {
        taskService: {
            getTaskById: () => task,
            updateTask: () => task
        },
        areaService: {
            getAreaById: () => null
        },
        contextService: {
            getContextById: () => null
        },
        tagService: {
            getTagById: () => null
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
                createNotionTaskPage: async () => {
                    throw new Error("Esquema inválido");
                }
            }
        },
        render() {}
    };

    const controller =
        new NotionTaskNotesController(app, {
            documentRef: null,
            windowRef: {
                open: (...args) => {
                    openedUrls.push(args);
                }
            }
        });

    await controller.create("task-1");

    assert.deepEqual(openedUrls, []);
    assert.equal(
        controller.errorMessage,
        "Esquema inválido"
    );

});
