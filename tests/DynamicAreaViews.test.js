import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Task } from "../src/domain/Task.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";
import { View } from "../src/core/View.js";
import {
    getTaskCreationDefaults,
    getTaskCreationView
} from "../src/core/TaskCreationDefaults.js";

test("crear desde un área hereda esa área", () => {

    assert.deepEqual(
        getTaskCreationDefaults(
            View.AREA,
            "2026-07-27",
            { areaId: "area-1" }
        ),
        { areaId: "area-1" }
    );

    assert.equal(
        getTaskCreationView(
            View.AREA
        ),
        View.AREA
    );

});

test("una tarea creada con área comienza pendiente", () => {

    const task = new Task({
        title: "Tarea de área",
        areaId: "area-1"
    });

    assert.equal(
        task.status,
        TaskStatus.PENDING
    );

});

test("la barra lateral y el router reconocen vistas de área", async () => {

    const sidebar = await readFile(
        new URL(
            "../src/ui/Sidebar.js",
            import.meta.url
        ),
        "utf8"
    );

    const router = await readFile(
        new URL(
            "../src/ui/ViewRouter.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        sidebar,
        /class="sidebarButton showAreaView/
    );

    assert.match(
        sidebar,
        /sidebarAreaColor/
    );

    assert.match(
        router,
        /case View\.AREA/
    );

    assert.match(
        router,
        /state\.activeArea/
    );

});
