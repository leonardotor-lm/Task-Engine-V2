import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";


test("el editor móvil conserva scroll vertical, guardado sticky y En espera plano", async () => {

    const styles = await readFile(
        new URL(
            "../styles/task-editor-mobile.css",
            import.meta.url
        ),
        "utf8"
    );
    const waitingStyles = await readFile(
        new URL("../styles/waiting.css", import.meta.url),
        "utf8"
    );
    const controller = await readFile(
        new URL(
            "../src/ui/MobileTaskEditorLayoutController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.ok(styles.includes("height: 100dvh;"));
    assert.ok(styles.includes("overflow-y: auto;"));
    assert.ok(styles.includes("overscroll-behavior-y: contain;"));
    assert.ok(styles.includes(".mobileTaskEditorFooter"));
    assert.ok(styles.includes("bottom: 0;"));

    assert.match(
        waitingStyles,
        /\.mobileTaskEditorWaitingProperty\.waitingTaskEditorField\s*\{[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;/
    );

    assert.match(
        controller,
        /"toggleTask",\s*\n\s*"saveTask"/
    );
    assert.doesNotMatch(
        controller,
        /saveButton\.classList\.add\(\s*"mobileTaskEditorHiddenSave"/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorLayout\s*\n\s*\.taskEditorActions #saveTask\s*\{[\s\S]*?display:\s*inline-flex;/
    );

});
