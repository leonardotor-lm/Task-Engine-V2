import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const styles = await readFile(
    new URL("../styles.css", import.meta.url),
    "utf8"
);

test("la barra lateral aumenta su tipografía sólo en celular", () => {

    assert.match(
        styles,
        /@media \(max-width: 760px\)\s*\{[\s\S]*?\.sidebar\s*\{[\s\S]*?font-size:\s*16px;[\s\S]*?line-height:\s*1\.3;/
    );
    assert.match(
        styles,
        /\.sidebarSectionLabel,[\s\S]*?\.customFiltersSection > summary\s*\{[\s\S]*?font-size:\s*13px;/
    );
    assert.match(
        styles,
        /\.sidebarNavigationGroup > summary\s*\{[\s\S]*?font-size:\s*15px;/
    );
    assert.match(
        styles,
        /\.sidebarTaskCount\s*\{[\s\S]*?font-size:\s*13px;/
    );

});
