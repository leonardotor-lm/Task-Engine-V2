import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const controller = await readFile(
    new URL(
        "../src/ui/CompactTaskToolbarController.js",
        import.meta.url
    ),
    "utf8"
);

const styles = await readFile(
    new URL(
        "../styles/mobile-task-toolbar.css",
        import.meta.url
    ),
    "utf8"
);

const index = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8"
);

const pwaAssets = await readFile(
    new URL("../pwa-assets.js", import.meta.url),
    "utf8"
);

test("la barra móvil permanece colapsable y mantiene un disparador compacto", () => {
    assert.match(
        controller,
        /task-engine-v2-mobile-task-toolbar-expanded-v2/
    );
    assert.match(
        controller,
        /defaultValue|false/
    );
    assert.match(
        controller,
        /mobileTaskToolbarToggle/
    );
    assert.match(
        controller,
        /Mostrar ↓|Ocultar ↑/
    );
});

test("los controles móviles se decoran en el mismo ciclo de construcción", () => {
    assert.match(
        controller,
        /this\.prepareMobileToggle\(toolbar\);\s*this\.decorateMobileControls\(state\);/
    );
    assert.doesNotMatch(
        controller,
        /queueMicrotask|Promise\.resolve\(\)\.then/
    );
});

test("filtros orden y agrupamiento se compactan sin cambiar sus controles", () => {
    assert.match(
        controller,
        /getElementById\("openTaskTools"\)/
    );
    assert.match(
        controller,
        /getElementById\("taskSort"\)/
    );
    assert.match(
        controller,
        /getElementById\("taskGrouping"\)/
    );
    assert.match(
        controller,
        /mobileTaskToolbarSelect/
    );
    assert.match(
        styles,
        /\.mobileTaskToolbarSelect > select/
    );
    assert.match(
        styles,
        /opacity:\s*0/
    );
});

test("las opciones secundarias usan Más salvo durante selección múltiple", () => {
    assert.match(
        controller,
        /mobileTaskToolbarMore/
    );
    assert.match(
        controller,
        /state\.bulkSelectionMode/
    );
    assert.match(
        controller,
        /unwrapUtilities/
    );
    assert.match(
        styles,
        /mobileTaskToolbarBulkMode/
    );
});

test("los nuevos estilos se cargan y quedan disponibles offline", () => {
    assert.match(
        index,
        /styles\/mobile-task-toolbar\.css/
    );
    assert.match(
        pwaAssets,
        /\.\/styles\/mobile-task-toolbar\.css/
    );
    assert.match(
        styles,
        /@media \(max-width: 760px\)/
    );
    assert.match(
        styles,
        /width:\s*44px/
    );
});
