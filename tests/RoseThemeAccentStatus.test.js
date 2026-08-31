import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const roseCss = await readFile(
    new URL("../styles/themes/rose.css", import.meta.url),
    "utf8"
);

test("Rosa destaca títulos de vista y encabezado lateral en rosa", () => {
    assert.match(
        roseCss,
        /\.taskListHeading h2,[\s\S]*\.mobileHeader strong,[\s\S]*\.sidebarBrand h3[\s\S]*color:\s*var\(--color-accent-strong\)/
    );
});

test("Rosa muestra vencen hoy y sincronizado en verde", () => {
    assert.match(
        roseCss,
        /\.taskViewSummaryItem-today,[\s\S]*\.sidebarSyncStatus\.configured[\s\S]*color:\s*#15803d/
    );
});
