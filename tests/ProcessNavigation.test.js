import test from "node:test";
import assert from "node:assert/strict";
import { Task } from "../src/domain/Task.js";
import { Process } from "../src/domain/Process.js";
import { ProcessView } from "../src/ui/ProcessView.js";
import { ProcessController } from "../src/ui/ProcessController.js";

test("el selector ofrece sólo tareas y proyectos activos y conserva vínculos finalizados", () => {
    const tasks = ["INBOX", "PENDING", "COMPLETED", "ARCHIVED", "DELETED"].flatMap(status =>
        [false, true].map(isProject => new Task({ id: `${status}-${isProject}`, title: `${status}-${isProject}`, status, isProject })));
    const process = new Process({ title: "Lectura", taskIds: ["COMPLETED-true"] });
    const html = new ProcessView().editor(process, { goals: [], allTasks: tasks });
    const choices = html.split('class="processTaskChoices">')[1].split('</div>')[0];
    for (const task of tasks) {
        assert.equal(choices.includes(`value="${task.id}"`), ["INBOX", "PENDING"].includes(task.status));
    }
    assert.match(html, /type="hidden" name="taskIds" value="COMPLETED-true"/);
});

test("los proyectos vinculados abren su vista y las tareas conservan el editor", t => {
    const buttons = ["project", "parent", "task"].map(id => ({ dataset: { processTask: id }, addEventListener: (_, handler) => { buttons.find(button => button.dataset.processTask === id).click = handler; } }));
    const previous = globalThis.document;
    globalThis.document = { querySelectorAll: selector => selector === "[data-process-task]" ? buttons : [], getElementById: () => null };
    t.after(() => { globalThis.document = previous; });
    const opened = [];
    const app = {
        taskService: { getTaskById: id => ({ isProject: id === "project" }), getProjectDescendants: id => id === "parent" ? [{}] : [] },
        mainView: { callbacks: { onOpenProject: id => opened.push(["project", id]), onSelectTask: id => opened.push(["editor", id]) } }
    };
    new ProcessController(app).bind();
    buttons.forEach(button => button.click());
    assert.deepEqual(opened, [["project", "project"], ["project", "parent"], ["editor", "task"]]);
});
