import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const mainViewSource = await readFile(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);

test("la selección múltiple conserva el desplazamiento", () => {

    assert.match(
        mainViewSource,
        /preserveContentScroll\(callback\)[\s\S]*?contentScrollTop[\s\S]*?renderedContent\.scrollTop/
    );
    assert.match(
        mainViewSource,
        /\.bulkTaskCheckbox[\s\S]*?preserveContentScroll[\s\S]*?onToggleBulkSelection/
    );
    assert.match(
        mainViewSource,
        /bulkSelectAll[\s\S]*?preserveContentScroll[\s\S]*?onSetVisibleBulkSelection/
    );

});
