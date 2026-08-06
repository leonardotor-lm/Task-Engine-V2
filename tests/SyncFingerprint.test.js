import test from "node:test";
import assert from "node:assert/strict";

import {
    createSyncFingerprint
} from "../src/core/SyncFingerprint.js";

function backup({
    tasks = [],
    areas = [],
    contexts = [],
    tags = [],
    taskSortPreferences
} = {}) {

    const data = {
        tasks,
        areas,
        contexts,
        tags
    };

    if (taskSortPreferences !== undefined) {
        data.taskSortPreferences =
            taskSortPreferences;
    }

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data
    };

}

test("la huella no depende del orden de las entidades", () => {

    const first = createSyncFingerprint(
        backup({
            tasks: [
                { id: "b", version: 2 },
                { id: "a", version: 1 }
            ]
        })
    );

    const second = createSyncFingerprint(
        backup({
            tasks: [
                { id: "a", version: 1 },
                { id: "b", version: 2 }
            ]
        })
    );

    assert.equal(first, second);

});

test("detecta cambios de versión", () => {

    const before = createSyncFingerprint(
        backup({
            tasks: [
                { id: "task-1", version: 1 }
            ]
        })
    );

    const after = createSyncFingerprint(
        backup({
            tasks: [
                { id: "task-1", version: 2 }
            ]
        })
    );

    assert.notEqual(before, after);

});

test("detecta entidades creadas o eliminadas", () => {

    const oneTask = createSyncFingerprint(
        backup({
            tasks: [
                { id: "task-1", version: 1 }
            ]
        })
    );

    const twoTasks = createSyncFingerprint(
        backup({
            tasks: [
                { id: "task-1", version: 1 },
                { id: "task-2", version: 1 }
            ]
        })
    );

    assert.notEqual(oneTask, twoTasks);

});

test("incluye todas las colecciones sincronizables", () => {

    const base = createSyncFingerprint(
        backup()
    );

    const withTag = createSyncFingerprint(
        backup({
            tags: [
                { id: "tag-1", version: 1 }
            ]
        })
    );

    assert.notEqual(base, withTag);

});

test("detecta cambios en el orden de una vista", () => {

    const priority = createSyncFingerprint(
        backup({
            taskSortPreferences: {
                "view:today": "PRIORITY"
            }
        })
    );

    const newest = createSyncFingerprint(
        backup({
            taskSortPreferences: {
                "view:today": "CREATED_NEWEST"
            }
        })
    );

    assert.notEqual(priority, newest);

});

test("la huella del orden no depende del orden de las claves", () => {

    const first = createSyncFingerprint(
        backup({
            taskSortPreferences: {
                "view:today": "PRIORITY",
                "area:area-1": "DUE_DATE"
            }
        })
    );

    const second = createSyncFingerprint(
        backup({
            taskSortPreferences: {
                "area:area-1": "DUE_DATE",
                "view:today": "PRIORITY"
            }
        })
    );

    assert.equal(first, second);

});

test("rechaza copias incompletas", () => {

    assert.throws(
        () => createSyncFingerprint({
            data: {
                tasks: []
            }
        }),
        /incompleta/
    );

});
