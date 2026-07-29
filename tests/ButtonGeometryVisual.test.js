import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const styles = fs.readFileSync(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("los botones usan una geometría recta común", () => {
    assert.match(
        styles,
        /--button-radius:\s*0/
    );
    assert.match(
        styles,
        /button,[\s\S]*?\.importBackupButton,[\s\S]*?\.entityCreateManager > summary\s*\{[\s\S]*?border-radius:\s*var\(--button-radius\) !important/
    );
});

test("el radio de botones no modifica paneles ni campos", () => {
    const sharedRule = styles.match(
        /button,\n\.importBackupButton,\n\.searchableMultiSelectManager summary,[\s\S]*?border-radius:\s*var\(--button-radius\) !important;[\s\S]*?\}/
    );

    assert.ok(sharedRule);
    assert.doesNotMatch(
        sharedRule[0],
        /input|textarea|select|\.taskDrawer|\.goalItem/
    );
});
