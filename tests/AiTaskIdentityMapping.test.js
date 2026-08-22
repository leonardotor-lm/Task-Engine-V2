import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { buildAiTaskContext } from "../src/core/AiTaskContext.js";

test("el contexto de IA conserva taskId tras filtrar tareas cuando se solicita", () => {
    const context = buildAiTaskContext({
        tasks: [
            { id: "done", title: "Hecha", status: "COMPLETED" },
            { id: "pending-a", title: "Pendiente A", status: "PENDING" },
            { id: "pending-b", title: "Pendiente B", status: "PENDING" }
        ],
        question: "tareas pendientes",
        includeTaskIds: true,
        today: "2026-08-22"
    });

    assert.deepEqual(
        context.tasks.map(task => task.taskId),
        ["pending-a", "pending-b"]
    );
});

test("el contexto general no expone taskId por defecto", () => {
    const context = buildAiTaskContext({
        tasks: [{ id: "a", title: "Tarea", status: "PENDING" }],
        question: "tareas pendientes",
        today: "2026-08-22"
    });

    assert.equal("taskId" in context.tasks[0], false);
});

test("los flujos estructurados no reconstruyen IDs por índice", async () => {
    const files = [
        "AiPriorityProposalController.js",
        "AiDueDateProposalController.js",
        "AiWaitingProposalController.js",
        "AiOrganizationProposalController.js",
        "AiProjectProposalController.js",
        "AiTaskQualityController.js"
    ];

    for (const file of files) {
        const source = await fs.readFile(`src/ui/${file}`, "utf8");
        assert.match(source, /includeTaskIds:\s*true/);
        assert.doesNotMatch(source, /base\.tasks\.map\(\(task, index\)/);
        assert.doesNotMatch(source, /taskId:\s*\w+Tasks?\[index\]/);
    }
});
