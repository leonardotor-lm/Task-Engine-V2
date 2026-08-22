import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(
    new URL("../styles/ai.css", import.meta.url),
    "utf8"
);
const index = fs.readFileSync(
    new URL("../index.html", import.meta.url),
    "utf8"
);
const pwaAssets = fs.readFileSync(
    new URL("../pwa-assets.js", import.meta.url),
    "utf8"
);

test("las superficies de IA usan tokens semánticos de tema", () => {
    for (const selector of [
        ".aiAssistantDialog .aiChatMessage",
        ".aiPriorityProposalItem",
        ".aiDueDateProposalItem",
        ".aiWaitingProposalItem",
        ".aiOrganizationProposalItem",
        ".aiProjectProposalItem",
        ".aiTaskQualityItem"
    ]) {
        assert.match(css, new RegExp(selector.replaceAll(".", "\\.")));
    }

    assert.match(css, /background:\s*var\(--color-surface\)\s*!important/);
    assert.match(css, /border-color:\s*var\(--color-border\)\s*!important/);
    assert.match(css, /color:\s*var\(--color-text\)\s*!important/);
    assert.match(css, /color:\s*var\(--color-text-secondary\)\s*!important/);
    assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
    assert.doesNotMatch(css, /--(?:surface|border)-color/);
});

test("los estilos de IA se cargan y quedan disponibles offline", () => {
    assert.match(index, /styles\/ai\.css/);
    assert.match(pwaAssets, /\.\/styles\/ai\.css/);
});
