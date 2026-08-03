import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const styles = fs.readFileSync(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("la interfaz usa una geometría recta común", () => {
    assert.match(
        styles,
        /--interface-radius:\s*0/
    );
    assert.match(
        styles,
        /button,[\s\S]*?\.goalItem\s*\{[\s\S]*?border-radius:\s*var\(--interface-radius\) !important/
    );
});

test("la geometría recta alcanza controles, editores y paneles", () => {
    const sharedRule = styles.match(
        /button,\n\.importBackupButton,\ndetails > summary,\nselect,[\s\S]*?input\[type="text"\],[\s\S]*?\.goalItem\s*\{[\s\S]*?border-radius:\s*var\(--interface-radius\) !important;[\s\S]*?\}/
    );

    assert.ok(sharedRule);
    assert.match(sharedRule[0], /details > summary/);
    assert.match(sharedRule[0], /select/);
    assert.match(sharedRule[0], /input:not\(\[type\]\)/);
    assert.match(sharedRule[0], /input\[type="text"\]/);
    assert.match(sharedRule[0], /input\[type="password"\]/);
    assert.match(sharedRule[0], /input\[type="color"\]/);
    assert.match(sharedRule[0], /input\[type="search"\]/);
    assert.match(sharedRule[0], /input\[type="date"\]/);
    assert.match(sharedRule[0], /\.taskDrawer textarea/);
    assert.match(sharedRule[0], /#goalEditorForm textarea/);
    assert.match(sharedRule[0], /textarea/);
    assert.match(sharedRule[0], /\.syncTools/);
    assert.match(sharedRule[0], /\.backupTools/);
    assert.match(sharedRule[0], /\.goalItem/);
});
