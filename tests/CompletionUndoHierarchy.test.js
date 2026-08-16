import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { TaskService } from "../src/core/TaskService.js";
import { TaskList } from "../src/ui/TaskList.js";

test("deshacer una subtarea de Inbox restaura el control del padre", () => {

    const parent = new Task({
        id: "parent",
        title: "Proyecto en Inbox"
    });
    const child = new Task({
        id: "child",
        title: "Subtarea",
        parentTaskId: parent.id
    });
    const tasks = [parent, child];
    const service = new TaskService({
        getAll: () => [...tasks],
        getById: id =>
            tasks.find(task => task.id === id) ?? null,
        update() {}
    });

    service.toggleTask(child.id);
    service.undoTaskCompletion(child.id);

    const inboxTasks = service.getInboxTasks();
    const html = new TaskList().render(
        inboxTasks,
        "Inbox",
        false,
        [],
        [],
        [],
        "",
        new Set(),
        false,
        new Set(),
        false,
        "ACTIVE",
        true,
        "",
        tasks
    );

    assert.deepEqual(
        inboxTasks.map(task => task.id),
        [parent.id, child.id]
    );
    assert.match(
        html,
        /class="toggleSubtasks"[\s\S]*?data-id="parent"/
    );

});
