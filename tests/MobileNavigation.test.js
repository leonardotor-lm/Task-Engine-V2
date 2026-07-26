import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mainView = await readFile(
    new URL(
        "../src/ui/MainView.js",
        import.meta.url
    ),
    "utf8"
);

const sidebar = await readFile(
    new URL(
        "../src/ui/Sidebar.js",
        import.meta.url
    ),
    "utf8"
);

const styles = await readFile(
    new URL(
        "../styles.css",
        import.meta.url
    ),
    "utf8"
);

test("la interfaz incluye navegación móvil accesible", () => {

    assert.match(
        mainView,
        /id="toggleMobileMenu"/
    );

    assert.match(
        mainView,
        /aria-controls="appSidebar"/
    );

    assert.match(
        sidebar,
        /id="appSidebar"/
    );

});

test("la barra lateral se convierte en panel móvil", () => {

    assert.match(
        styles,
        /@media \(max-width: 760px\)/
    );

    assert.match(
        styles,
        /\.mobileMenuOpen \.sidebar/
    );

    assert.match(
        styles,
        /\.mobileMenuOpen \.mobileMenuBackdrop/
    );

});
