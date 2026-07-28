import test from "node:test";
import assert from "node:assert/strict";

import {
    createTaskDraft,
    hasTaskEditorChanges,
    taskDraftsEqual
} from "../src/ui/TaskEditorDraft.js";

const task = {
    title: "Preparar clase",
    description: "Literatura",
    areaId: "area-1",
    contextId: null,
    priority: 2,
    dueDate: "2026-07-28",
    tagIds: ["tag-2", "tag-1"],
    goalIds: ["goal-2", "goal-1"],
    recurrence: null
};

const createRoot = overrides => {

    const values = {
        "#taskTitleEdit":
            "Preparar clase",
        "#taskDescriptionEdit":
            "Literatura",
        "#taskArea":
            "area-1",
        "#taskContext":
            "",
        "#taskPriority":
            "2",
        "#taskDueDate":
            "2026-07-28",
        "#taskRecurrence":
            "",
        ...overrides
    };

    return {
        querySelector(selector) {
            return values[selector] ===
                undefined
                ? null
                : {
                    value:
                        values[selector]
                };
        },
        querySelectorAll(selector) {
            return selector ===
                ".taskTag:checked"
                ? [
                    { value: "tag-1" },
                    { value: "tag-2" }
                ]
                : selector ===
                    ".taskGoal:checked"
                    ? [
                        { value: "goal-1" },
                        { value: "goal-2" }
                    ]
                    : [];
        }
    };

};

test("no detecta cambios cuando el editor coincide con la tarea", () => {

    assert.equal(
        hasTaskEditorChanges(
            task,
            createRoot()
        ),
        false
    );

});

test("detecta un título modificado", () => {

    assert.equal(
        hasTaskEditorChanges(
            task,
            createRoot({
                "#taskTitleEdit":
                    "Preparar otra clase"
            })
        ),
        true
    );

});

test("el orden de las etiquetas no produce cambios falsos", () => {

    assert.equal(
        taskDraftsEqual(
            createTaskDraft(task),
            {
                ...createTaskDraft(task),
                tagIds: [
                    "tag-1",
                    "tag-2"
                ]
            }
        ),
        true
    );

});
