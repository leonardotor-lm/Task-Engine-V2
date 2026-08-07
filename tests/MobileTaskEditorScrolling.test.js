import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";


test("el editor móvil conserva scroll vertical y En espera sin recuadro", async () => {

    const styles = await readFile(
        new URL(
            "../styles/task-editor-mobile.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.ok(styles.includes("height: 100dvh;"));
    assert.ok(styles.includes("overflow-y: auto;"));
    assert.ok(styles.includes("overscroll-behavior-y: contain;"));
    assert.ok(styles.includes("bottom: 0;"));

    const waitingStart = styles.indexOf(
        ".mobileTaskEditorWaitingProperty\n        .waitingTaskControl"
    );

    assert.notEqual(waitingStart, -1);

    const waitingRules = styles.slice(
        waitingStart,
        waitingStart + 700
    );

    assert.ok(waitingRules.includes("border: 0;"));
    assert.ok(waitingRules.includes("background: transparent;"));
    assert.ok(waitingRules.includes("margin: 0;"));

});
