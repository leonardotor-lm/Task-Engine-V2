import test from "node:test";
import assert from "node:assert/strict";
import {
    buildAiTaskContext
} from "../src/core/AiTaskContext.js";

test("limita el contexto de IA para respetar cuotas gratuitas", () => {
    const tasks = Array.from(
        { length: 120 },
        (_, index) => ({
            id: `task-${index}`,
            title: `Tarea ${index}`,
            status: "PENDING",
            priority: 0,
            tagIds: []
        })
    );

    const context = buildAiTaskContext({
        tasks,
        today: "2026-08-21"
    });

    assert.equal(context.taskCount, 70);
    assert.equal(context.tasks.length, 70);
    assert.equal(context.omittedCount, 50);
});
