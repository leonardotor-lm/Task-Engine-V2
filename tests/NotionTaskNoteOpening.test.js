import test from "node:test";
import assert from "node:assert/strict";
import {
    NotionTaskNotesController
} from "../src/ui/NotionTaskNotesController.js";

test("abre la nota recién creada en la pestaña iniciada por el usuario", async () => {

    const openedWindow = {
        closed: false,
        opener: {},
        location: {
            href: "about:blank"
        },
        close() {}
    };
    const openedUrls = [];
    const windowRef = {
        open: url => {
            openedUrls.push(url);
            return openedWindow;
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

    assert.deepEqual(openedUrls, [
        "about:blank"
    ]);
    assert.equal(openedWindow.opener, null);
    assert.equal(
        openedWindow.location.href,
        "https://www.notion.so/page-1"
    );
    assert.deepEqual(updatedData, {
        notionPageId: "page-1",
        notionPageUrl:
            "https://www.notion.so/page-1"
    });

});
