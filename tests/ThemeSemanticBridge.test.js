import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
    dirname(fileURLToPath(import.meta.url)),
    ".."
);

test("la hoja puente reemplaza colores heredados por tokens semanticos", async () => {

    const [settings, bridge, pwaAssets] = await Promise.all([
        readFile(
            resolve(ROOT, "styles/theme-settings.css"),
            "utf8"
        ),
        readFile(
            resolve(ROOT, "styles/theme-semantic-bridge.css"),
            "utf8"
        ),
        readFile(resolve(ROOT, "pwa-assets.js"), "utf8")
    ]);

    assert.match(
        settings,
        /@import url\("\.\/theme-semantic-bridge\.css"\);/
    );

    assert.match(
        bridge,
        /\.task:hover\s*\{[\s\S]*var\(--color-surface-hover\)/
    );
    assert.match(
        bridge,
        /\.bulkModeNotice\s*\{[\s\S]*background:\s*var\(--color-accent-soft\)[\s\S]*color:\s*var\(--color-text\)/
    );
    assert.match(
        bridge,
        /:root\[data-theme\] \.task \.toggleSubtasks,[\s\S]*:root\[data-theme\] \.task \.manualOrderHandle[\s\S]*background-color:\s*transparent/
    );
    assert.match(
        bridge,
        /\.manualOrderHandle:hover,[\s\S]*\.manualOrderHandle:active[\s\S]*background-color:\s*transparent[\s\S]*color:\s*var\(--color-text\)/
    );
    assert.match(
        bridge,
        /\.taskMeta\s*\{[\s\S]*var\(--color-text-secondary\)/
    );
    assert.match(
        bridge,
        /\.priority-4,[\s\S]*\.destructiveAction[\s\S]*color:\s*var\(--color-danger\)/
    );
    assert.match(
        bridge,
        /\.recurrenceIndicator,[\s\S]*\.recurrenceIcon[\s\S]*color:\s*var\(--color-accent-strong\)/
    );
    assert.match(
        bridge,
        /\.taskCompletionNotice\s*\{[\s\S]*background:\s*var\(--color-accent-strong\)[\s\S]*color:\s*var\(--color-on-accent\)/
    );
    assert.match(
        bridge,
        /:root\[data-theme\] \.taskCompletionNotice button\s*\{[\s\S]*border-color:\s*var\(--color-on-accent\)[\s\S]*background-color:\s*transparent[\s\S]*color:\s*var\(--color-on-accent\)/
    );
    assert.match(
        bridge,
        /\.advancedSearchError\s*\{[\s\S]*var\(--color-danger-soft\)/
    );
    assert.match(
        bridge,
        /outline-color:\s*var\(--color-focus-ring\)/
    );
    assert.doesNotMatch(
        bridge,
        /#[0-9a-f]{3,8}\b/i
    );

    assert.match(
        pwaAssets,
        /\.\/styles\/theme-semantic-bridge\.css/
    );

});
