import test from "node:test";
import assert from "node:assert/strict";

import {
    TaskDisplayPreferences
} from "../src/infrastructure/TaskDisplayPreferences.js";

class MemoryStorage {

    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.get(key) ?? null;
    }

    setItem(key, value) {
        this.values.set(key, value);
    }

}

test("muestra los metadatos de forma predeterminada", () => {

    const preferences =
        new TaskDisplayPreferences(
            new MemoryStorage()
        );

    assert.equal(
        preferences.isMetadataVisible(),
        true
    );

});

test("recuerda el modo reducido", () => {

    const storage = new MemoryStorage();

    const preferences =
        new TaskDisplayPreferences(storage);

    assert.equal(
        preferences.toggleMetadata(),
        false
    );

    const restored =
        new TaskDisplayPreferences(storage);

    assert.equal(
        restored.isMetadataVisible(),
        false
    );

});

test("recuerda el título personalizado de la barra lateral", () => {

    const storage = new MemoryStorage();

    const preferences =
        new TaskDisplayPreferences(storage);

    assert.equal(
        preferences.getSidebarTitle(),
        ""
    );

    assert.equal(
        preferences.setSidebarTitle(
            "  Tareas de Leo  "
        ),
        "Tareas de Leo"
    );

    assert.equal(
        new TaskDisplayPreferences(storage)
            .getSidebarTitle(),
        "Tareas de Leo"
    );

});

test("migra el nombre lateral de la primera versión", () => {

    const storage = new MemoryStorage();

    storage.setItem(
        "task-engine-v2-sidebar-user-name",
        "Leo"
    );

    const preferences =
        new TaskDisplayPreferences(storage);

    assert.equal(
        preferences.getSidebarTitle(),
        "Leo"
    );
    assert.equal(
        storage.getItem(
            "task-engine-v2-sidebar-title"
        ),
        "Leo"
    );

});
