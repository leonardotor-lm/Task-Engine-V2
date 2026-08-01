import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("la lista móvil combina legibilidad y densidad", () => {

    const mobileStyles = styles.slice(
        styles.lastIndexOf(
            "@media (max-width: 760px)",
            styles.indexOf(".taskDueDate.overdue") + 500
        )
    );

    assert.match(
        mobileStyles,
        /\.taskTitle\s*\{[\s\S]*?font-size:\s*15px;[\s\S]*?line-height:\s*1\.25;/
    );
    assert.match(
        mobileStyles,
        /\.taskMeta\s*\{[\s\S]*?margin-top:\s*0;[\s\S]*?font-size:\s*12px;[\s\S]*?line-height:\s*1\.25;/
    );
    assert.match(
        mobileStyles,
        /\.taskTitleLine\s*\{[\s\S]*?min-height:\s*0;/
    );

});
