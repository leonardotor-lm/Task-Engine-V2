import test from "node:test";
import assert from "node:assert/strict";

import { TaskService } from "../src/core/TaskService.js";
import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { ViewRouter } from "../src/ui/ViewRouter.js";
import { View } from "../src/core/View.js";

function createRepository(tasks) {

    let stored = [...tasks];

    return {

        getAll() {
            return [...stored];
        },

        getById(id) {
            return stored.find(task => task.id === id) ?? null;
        },

        remove(id) {
            stored = stored.filter(task => task.id !== id);
        }

    };

}

test("vacía únicamente las tareas de la papelera", () => {

    const deleted = new Task({
        id: "deleted",
        title: "Borrada",
        status: TaskStatus.DELETED
    });

    const active = new Task({
        id: "active",
        title: "Activa",
        status: TaskStatus.PENDING
    });

    const repository = createRepository([
        deleted,
        active
    ]);

    const removed = new TaskService(
        repository
    ).emptyTrash();

    assert.equal(removed.length, 1);
    assert.deepEqual(
        repository.getAll().map(task => task.id),
        [active.id]
    );

});

test("Papelera muestra Vaciar papelera sólo cuando contiene tareas", () => {

    const deleted = new Task({
        id: "deleted",
        title: "Borrada",
        status: TaskStatus.DELETED
    });

    const baseState = {
        view: View.TRASH,
        tasks: [],
        allTasks: [],
        taskCreationOpen: false,
        areas: [],
        contexts: [],
        tags: [],
        searchQuery: "",
        expandedTaskIds: new Set(),
        filtersActive: false,
        selectedTaskIds: new Set(),
        bulkSelectionEnabled: false,
        bulkActionMode: "TRASH",
        showTaskMetadata: true,
        today: "2026-07-25",
        inlineSubtaskParentId: null
    };

    const router = new ViewRouter();

    assert.doesNotMatch(
        router.render(baseState),
        /id="emptyTrash"/
    );

    assert.match(
        router.render({
            ...baseState,
            tasks: [deleted],
            allTasks: [deleted]
        }),
        /id="emptyTrash"/
    );

    const renderedTrash = router.render({
        ...baseState,
        tasks: [deleted],
        allTasks: [deleted]
    });

    assert.match(
        renderedTrash,
        /id="emptyTrash"[\s\S]*responsiveIconButton/
    );
    assert.match(
        renderedTrash,
        /aria-label="Vaciar papelera"/
    );
    assert.match(
        renderedTrash,
        /responsiveButtonIcon[\s\S]*<svg/
    );

});
