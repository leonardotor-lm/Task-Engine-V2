import test from "node:test";
import assert from "node:assert/strict";
import { Task } from "../src/domain/Task.js";

test("una tarea conserva el vínculo a su página de Notion", () => {

    const task = new Task({
        title: "Preparar clase",
        notionPageId: "page-123",
        notionPageUrl:
            "https://www.notion.so/page-123"
    });

    const json = task.toJSON();

    assert.equal(
        json.notionPageId,
        "page-123"
    );
    assert.equal(
        json.notionPageUrl,
        "https://www.notion.so/page-123"
    );

});

test("una tarea puede desvincularse sin borrar otros datos", () => {

    const task = new Task({
        title: "Preparar clase",
        notionPageId: "page-123",
        notionPageUrl:
            "https://www.notion.so/page-123"
    });

    task.update({
        notionPageId: null,
        notionPageUrl: null
    });

    assert.equal(task.notionPageId, null);
    assert.equal(task.notionPageUrl, null);
    assert.equal(task.title, "Preparar clase");
    assert.equal(task.version, 2);

});

test("los vínculos vacíos se normalizan a null", () => {

    const task = new Task({
        title: "Preparar clase",
        notionPageId: "   ",
        notionPageUrl: ""
    });

    assert.equal(task.notionPageId, null);
    assert.equal(task.notionPageUrl, null);

});
