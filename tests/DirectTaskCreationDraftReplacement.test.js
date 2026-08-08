import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { View } from "../src/core/View.js";
import {
    DirectTaskCreationController,
    isSubtaskCreationDraft
} from "../src/ui/DirectTaskCreationController.js";

function attachment() {
    return {
        id: "attachment-1",
        driveFileId: "drive-file-1",
        name: "borrador.pdf",
        mimeType: "application/pdf",
        size: 512,
        url: "https://drive.google.com/file/d/drive-file-1/view",
        createdAt: "2026-08-08T20:00:00.000Z"
    };
}

test("reemplazar un borrador de subtarea limpia primero sus adjuntos", async () => {

    const parent = new Task({
        id: "project",
        title: "Proyecto",
        status: TaskStatus.PENDING
    });
    const tasks = [parent];
    const trashed = [];

    const callbacks = {
        onOpenTaskCreation() {},
        onOpenProjectTaskCreation() {},
        onUpdateTask() {},
        onCloseTaskEditor() {}
    };

    const app = {
        currentView: View.PROJECT,
        currentAreaId: null,
        projectTaskId: parent.id,
        taskCreationOpen: false,
        projectTaskCreationOpen: false,
        inlineSubtaskParentId: null,
        bulkSelectionMode: false,
        selectedTaskIds: new Set(),
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
            getTaskById(id) {
                return tasks.find(task => task.id === id) ?? null;
            },
            isActiveTask(task) {
                return (
                    task.status !== TaskStatus.COMPLETED &&
                    task.status !== TaskStatus.ARCHIVED &&
                    task.status !== TaskStatus.DELETED
                );
            },
            createTask(data) {
                const task = new Task(data);
                tasks.push(task);
                return task;
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
                async trashAttachment({ driveFileId }) {
                    trashed.push(driveFileId);
                }
            }
        },
        getTodayString() {
            return "2026-08-08";
        },
        render() {}
    };

    const controller = new DirectTaskCreationController(
        app,
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

    await callbacks.onOpenProjectTaskCreation();

    const firstDraft = app.selectedTask;
    firstDraft.addAttachment(attachment());

    await callbacks.onOpenProjectTaskCreation();

    assert.deepEqual(trashed, ["drive-file-1"]);
    assert.notEqual(app.selectedTask.id, firstDraft.id);
    assert.equal(
        isSubtaskCreationDraft(app.selectedTask),
        true
    );
    assert.equal(tasks.length, 1);

});
