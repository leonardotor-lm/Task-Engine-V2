import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const enhancer = await readFile(
    new URL(
        "../src/ui/MobileTaskEditorCompactEnhancer.js",
        import.meta.url
    ),
    "utf8"
);

const loader = await readFile(
    new URL(
        "../src/ui/MobileTaskEditorCompactLoader.js",
        import.meta.url
    ),
    "utf8"
);

const styles = await readFile(
    new URL(
        "../styles/task-editor-mobile-compact.css",
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

test("Área y Contexto permanecen visibles como organización primaria", () => {
    assert.match(
        enhancer,
        /mobileTaskEditorOrganizationHeading/
    );
    assert.match(
        enhancer,
        /contextLabel\.textContent = "@Contexto"/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorContextBar[\s\S]*grid-template-columns:\s*1fr/
    );
    assert.match(
        styles,
        /\.mobileTaskEditorContextField[\s\S]*min-height:\s*54px/
    );
});

test("las propiedades secundarias se presentan como seis accesos compactos", () => {
    for (const label of [
        "Prioridad",
        "Vencimiento",
        "Etiquetas",
        "Programación",
        "Adjuntos",
        "Objetivo"
    ]) {
        assert.match(
            enhancer,
            new RegExp(`label: "${label}"|>${label}<|${label}`)
        );
    }

    assert.match(
        styles,
        /mobileTaskEditorToolGrid[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/
    );
    assert.match(
        styles,
        /mobileTaskEditorCompactSummary[\s\S]*height:\s*82px/
    );
});

test("Adjuntos inicia cerrado y sólo se abre por acción del usuario", () => {
    assert.match(
        loader,
        /\.mobileTaskEditorCompactAttachments/
    );
    assert.match(
        loader,
        /panel\.open = false/
    );
    assert.match(
        loader,
        /mobileCompactInitialState/
    );
});

test("las acciones administrativas pasan al menú y Guardar queda en el pie", () => {
    assert.match(
        enhancer,
        /mobileTaskEditorCompactOverflow/
    );
    assert.match(
        enhancer,
        /primary\?\.querySelector\("#toggleTask"\)/
    );
    assert.match(
        enhancer,
        /save\.textContent = "Guardar"/
    );
    assert.match(
        enhancer,
        /cancel\.textContent = "Cancelar"/
    );
});

test("el cargador no observa continuamente el DOM", () => {
    assert.doesNotMatch(
        loader,
        /new MutationObserver/
    );
    assert.match(
        loader,
        /synchronizeCompactEditorOnce/
    );
    assert.match(
        loader,
        /setTimeout/
    );
});

test("la mejora queda aislada a móvil y disponible en la PWA", () => {
    assert.match(
        enhancer,
        /\(max-width: 760px\)/
    );
    assert.match(
        loader,
        /task-editor-mobile-compact\.css/
    );
    assert.match(
        index,
        /MobileTaskEditorCompactLoader\.js/
    );
    assert.match(
        pwaAssets,
        /MobileTaskEditorCompactEnhancer\.js/
    );
    assert.match(
        pwaAssets,
        /MobileTaskEditorCompactLoader\.js/
    );
    assert.match(
        pwaAssets,
        /task-editor-mobile-compact\.css/
    );
});

test("la hoja compacta conserva llaves CSS balanceadas", () => {
    const withoutComments = styles.replace(
        /\/\*[\s\S]*?\*\//g,
        ""
    );
    const opening = withoutComments.match(/\{/g)?.length ?? 0;
    const closing = withoutComments.match(/\}/g)?.length ?? 0;

    assert.equal(opening, closing);
});
