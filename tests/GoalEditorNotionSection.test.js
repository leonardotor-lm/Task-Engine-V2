import test from "node:test";
import assert from "node:assert/strict";
import { GoalEditor } from "../src/ui/GoalEditor.js";

test("el editor de objetivos muestra Crear nota sin depender de inserción posterior", () => {

    const editor = new GoalEditor();
    const goal = {
        id: "goal-1",
        title: "Objetivo de prueba",
        description: "",
        status: "ACTIVE",
        dueDate: null,
        parentGoalId: null,
        notionPageId: null,
        notionPageUrl: null
    };

    const html = editor.render(goal, [goal], []);

    assert.match(html, /notionGoalNotesSection/);
    assert.match(html, />Notas</);
    assert.match(html, /id="createNotionGoalNote"/);
    assert.match(html, />\s*Crear nota\s*</);

});
