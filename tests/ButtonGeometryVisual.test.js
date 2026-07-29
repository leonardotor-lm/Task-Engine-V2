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
        /button,[\s\S]*?\.importBackupButton,[\s\S]*?details > summary,[\s\S]*?select,[\s\S]*?input\[type="search"\]\s*\{[\s\S]*?border-radius:\s*var\(--button-radius\) !important/
    );
});

test("la geometría recta alcanza desplegables y búsquedas", () => {
    const sharedRule = styles.match(
        /button,\n\.importBackupButton,\ndetails > summary,\nselect,\ninput\[type="search"\][\s\S]*?border-radius:\s*var\(--button-radius\) !important;[\s\S]*?\}/
    );

    assert.ok(sharedRule);
    assert.match(sharedRule[0], /details > summary/);
    assert.match(sharedRule[0], /select/);
    assert.match(sharedRule[0], /input\[type="search"\]/);
    assert.doesNotMatch(sharedRule[0], /textarea|input\[type="text"\]/);
});
