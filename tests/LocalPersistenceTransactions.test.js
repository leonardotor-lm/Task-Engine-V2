import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Area } from "../src/domain/Area.js";
import { Context } from "../src/domain/Context.js";
import { CustomFilter } from "../src/domain/CustomFilter.js";
import { AreaService } from "../src/core/AreaService.js";
import { ContextService } from "../src/core/ContextService.js";
import {
    CustomFilterService
} from "../src/core/CustomFilterService.js";
import {
    installAreaServiceTransactionGuard,
    installContextServiceTransactionGuard,
    installCustomFilterServiceTransactionGuard
} from "../src/core/EntityServiceTransactionGuard.js";
import {
    ActivityRepository
} from "../src/infrastructure/ActivityRepository.js";
import {
    TaskFilterPreferencesRepository
} from "../src/infrastructure/TaskFilterPreferencesRepository.js";
import {
    AiPreferences
} from "../src/infrastructure/AiPreferences.js";

const appSource = await readFile(
    new URL("../src/core/App.js", import.meta.url),
    "utf8"
);

class FaultyStorage {

    constructor(entries = {}) {
        this.data = new Map(Object.entries(entries));
        this.failure = null;
    }

    failOnce(method, key = null) {
        this.failure = { method, key };
    }

    maybeFail(method, key) {
        if (
            this.failure?.method === method &&
            (
                this.failure.key === null ||
                this.failure.key === key
            )
        ) {
            this.failure = null;
            throw new Error("fallo simulado de almacenamiento");
        }
    }

    getItem(key) {
        return this.data.get(key) ?? null;
    }

    setItem(key, value) {
        this.maybeFail("setItem", key);
        this.data.set(key, String(value));
    }

    removeItem(key) {
        this.maybeFail("removeItem", key);
        this.data.delete(key);
    }

}

function createRepository(
    Entity,
    entries,
    failMethod
) {
    return {
        entries: [...entries],
        getAll() {
            return [...this.entries];
        },
        getById(id) {
            return this.entries.find(
                item => item.id === id
            ) ?? null;
        },
        add(data) {
            const item = new Entity(data);
            this.entries.push(item);
            if (failMethod === "add") {
                throw new Error("fallo simulado al agregar");
            }
            return item;
        },
        update(item) {
            const index = this.entries.findIndex(
                current => current.id === item.id
            );
            this.entries[index] = item;
            if (failMethod === "update") {
                throw new Error("fallo simulado al actualizar");
            }
        },
        remove(id) {
            this.entries = this.entries.filter(
                item => item.id !== id
            );
            if (failMethod === "remove") {
                throw new Error("fallo simulado al eliminar");
            }
        },
        replaceAll(nextEntries) {
            this.entries = [...nextEntries];
        }
    };
}

test("restaura un área mutada antes de una actualización fallida", () => {
    const repository = createRepository(
        Area,
        [new Area({
            id: "area",
            name: "Original",
            color: "#123456"
        })],
        "update"
    );
    const service = new AreaService(repository);
    installAreaServiceTransactionGuard(service);

    assert.throws(
        () => service.updateArea(
            "area",
            { name: "Modificada" }
        ),
        /fallo simulado al actualizar/
    );

    assert.equal(
        repository.getById("area").name,
        "Original"
    );
});

test("no conserva un contexto cuya creación falló", () => {
    const repository = createRepository(
        Context,
        [],
        "add"
    );
    const service = new ContextService(repository);
    installContextServiceTransactionGuard(service);

    assert.throws(
        () => service.createContext({
            name: "Casa",
            color: "#123456"
        }),
        /fallo simulado al agregar/
    );

    assert.equal(repository.getAll().length, 0);
});

test("restaura un filtro si falla su eliminación", () => {
    const repository = createRepository(
        CustomFilter,
        [new CustomFilter({
            id: "filter",
            name: "Pendientes",
            query: "status:PENDING"
        })],
        "remove"
    );
    const service = new CustomFilterService(
        repository
    );
    installCustomFilterServiceTransactionGuard(
        service
    );

    assert.throws(
        () => service.deleteFilter("filter"),
        /fallo simulado al eliminar/
    );

    assert.notEqual(
        repository.getById("filter"),
        null
    );
});

test("un evento fallido no reaparece en una escritura posterior", () => {
    const storage = new FaultyStorage();
    const repository = new ActivityRepository(storage);

    storage.failOnce("setItem");
    assert.throws(
        () => repository.add({
            type: "TASK_CREATED",
            taskTitle: "Fallida"
        }),
        /fallo simulado de almacenamiento/
    );

    assert.equal(repository.getAll().length, 0);

    repository.add({
        type: "TASK_CREATED",
        taskTitle: "Persistida"
    });

    assert.deepEqual(
        repository.getAll().map(
            event => event.taskTitle
        ),
        ["Persistida"]
    );
});

test("filtros rápidos fallidos conservan la configuración previa", () => {
    const storage = new FaultyStorage();
    const repository =
        new TaskFilterPreferencesRepository(
            storage
        );

    repository.set("TODAY", {
        priority: "HIGH"
    });
    storage.failOnce("setItem");

    assert.throws(
        () => repository.set("TODAY", {
            priority: "LOW"
        }),
        /fallo simulado de almacenamiento/
    );

    assert.equal(
        repository.get("TODAY").priority,
        "HIGH"
    );
});

test("un cambio fallido de IA restaura proveedor y modelo", () => {
    const providerKey =
        "task-engine-v2-ai-provider";
    const modelKey =
        "task-engine-v2-ai-model";
    const storage = new FaultyStorage({
        [providerKey]: "gemini",
        [modelKey]: "gemini-3.7-flash"
    });
    const preferences = new AiPreferences(storage);

    storage.failOnce("setItem", modelKey);

    assert.throws(
        () => preferences.setProvider("groq"),
        /fallo simulado de almacenamiento/
    );

    assert.equal(
        storage.getItem(providerKey),
        "gemini"
    );
    assert.equal(
        storage.getItem(modelKey),
        "gemini-3.7-flash"
    );
});

test("App instala los guards de organización y la PWA los conserva", async () => {
    for (const method of [
        "installAreaServiceTransactionGuard",
        "installContextServiceTransactionGuard",
        "installTagServiceTransactionGuard",
        "installCustomFilterServiceTransactionGuard"
    ]) {
        assert.match(appSource, new RegExp(method));
    }

    const assets = await readFile(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );

    assert.match(
        assets,
        /EntityServiceTransactionGuard\.js/
    );
});
