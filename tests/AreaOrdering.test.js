import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { AreaService } from "../src/core/AreaService.js";
import { EntityManager } from "../src/ui/EntityManager.js";

function withStorage(callback) {
    const originalStorage = globalThis.localStorage;
    const values = new Map();

    globalThis.localStorage = {
        getItem(key) {
            return values.get(key) ?? null;
        },
        setItem(key, value) {
            values.set(key, value);
        }
    };

    try {
        callback();
    } finally {
        globalThis.localStorage = originalStorage;
    }
}

test("las áreas nuevas reciben órdenes consecutivos", () => {
    withStorage(() => {
        const service = new AreaService();

        const first = service.createArea({ name: "Personal" });
        const second = service.createArea({ name: "Trabajo" });

        assert.equal(first.order, 0);
        assert.equal(second.order, 1);
    });
});

test("permite subir y bajar áreas y persiste el resultado", () => {
    withStorage(() => {
        const service = new AreaService();
        const first = service.createArea({ name: "Personal" });
        const second = service.createArea({ name: "Trabajo" });
        const third = service.createArea({ name: "Estudio" });

        service.moveArea(third.id, "UP");
        assert.deepEqual(
            service.getAllAreas().map(area => area.id),
            [first.id, third.id, second.id]
        );

        service.moveArea(first.id, "DOWN");
        assert.deepEqual(
            new AreaService()
                .getAllAreas()
                .map(area => area.id),
            [third.id, first.id, second.id]
        );
    });
});

test("el gestor muestra controles accesibles sólo al ordenar", () => {
    const entities = [
        { id: "a", name: "Personal", color: "#000000" },
        { id: "b", name: "Trabajo", color: "#ffffff" }
    ];
    const manager = new EntityManager();
    const ordered = manager.render(
        "Áreas",
        entities,
        { reorderable: true }
    );
    const normal = manager.render(
        "Contextos",
        entities
    );

    assert.match(ordered, /aria-label="Subir Personal"/);
    assert.match(ordered, /aria-label="Bajar Trabajo"/);
    assert.match(
        ordered,
        /data-direction="UP"[\s\S]*?disabled/
    );
    assert.doesNotMatch(normal, /class="moveEntity/);
});

test("la interfaz conecta los controles con el servicio", () => {
    const appSource = fs.readFileSync(
        new URL("../src/core/App.js", import.meta.url),
        "utf8"
    );
    const mainViewSource = fs.readFileSync(
        new URL("../src/ui/MainView.js", import.meta.url),
        "utf8"
    );

    assert.match(
        appSource,
        /onMoveArea:[\s\S]*?areaService\.moveArea/
    );
    assert.match(
        mainViewSource,
        /\.moveEntity[\s\S]*?config\.move/
    );
});

test("los controles de orden no se comprimen en el panel", () => {
    const styles = fs.readFileSync(
        new URL("../styles.css", import.meta.url),
        "utf8"
    );

    assert.match(
        styles,
        /\.entityManager \.entityActions\s*\{[\s\S]*?flex:\s*0 0 auto/
    );
    assert.match(
        styles,
        /\.entityManager \.moveEntity\s*\{[\s\S]*?flex:\s*0 0 30px[\s\S]*?border-color:\s*var\(--color-border\)/
    );
    assert.match(
        styles,
        /@media \(max-width: 760px\)[\s\S]*?\.entityManager \.moveEntity\s*\{[\s\S]*?flex-basis:\s*44px/
    );
});
