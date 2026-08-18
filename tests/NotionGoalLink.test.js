import test from "node:test";
import assert from "node:assert/strict";
import { Goal } from "../src/domain/Goal.js";

test("el objetivo persiste y puede limpiar su vínculo de Notion", () => {

    const goal = new Goal({
        id: "goal-1",
        title: "Leer clásicos",
        notionPageId: "page-1",
        notionPageUrl: "https://www.notion.so/page-1"
    });

    const restored = new Goal(goal.toJSON());

    assert.equal(restored.notionPageId, "page-1");
    assert.equal(
        restored.notionPageUrl,
        "https://www.notion.so/page-1"
    );

    restored.update({
        notionPageId: null,
        notionPageUrl: null
    });

    assert.equal(restored.notionPageId, null);
    assert.equal(restored.notionPageUrl, null);

});
