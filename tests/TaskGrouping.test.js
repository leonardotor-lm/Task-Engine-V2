import test from "node:test";
import assert from "node:assert/strict";
import {
    TASK_GROUPING_PREFERENCES_STORAGE_KEY,
    TaskGrouping,
    TaskGroupingPreferencesRepository
} from "../src/infrastructure/TaskGroupingPreferencesRepository.js";
import {
    buildTaskGroups
} from "../src/ui/TaskGroupingController.js";

function createStorage() {
    const values = new Map();

    return {
        getItem(key) {
            return values.has(key)
                ? values.get(key)
                : null;
        },
        setItem(key, value) {
            values.set(key, value);
        }
    };
}

test("persiste una agrupación válida por vista y descarta valores inválidos", () => {
    const storage = createStorage();
    const repository =
        new TaskGroupingPreferencesRepository(storage);

    assert.equal(
        repository.get("view:TODAY"),
        TaskGrouping.NONE
    );

    repository.set(
        "view:TODAY",
        TaskGrouping.AREA
    );

    assert.equal(
        repository.get("view:TODAY"),
        TaskGrouping.AREA
    );
    assert.equal(
        JSON.parse(
            storage.getItem(
                TASK_GROUPING_PREFERENCES_STORAGE_KEY
            )
        )["view:TODAY"],
        TaskGrouping.AREA
    );
    assert.equal(
        repository.set("view:TODAY", "INVALID"),
        TaskGrouping.NONE
    );
});

test("agrupa por área alfabéticamente y deja Sin área al final sin alterar el orden interno", () => {
    const tasks = [
        { id: "1", areaId: "b" },
        { id: "2", areaId: null },
        { id: "3", areaId: "a" },
        { id: "4", areaId: "b" }
    ];

    const groups = buildTaskGroups(
        tasks,
        TaskGrouping.AREA,
        {
            areas: [
                { id: "a", name: "Casa" },
                { id: "b", name: "Trabajo" }
            ]
        }
    );

    assert.deepEqual(
        groups.map(group => ({
            label: group.label,
            ids: group.tasks.map(task => task.id)
        })),
        [
            { label: "Casa", ids: ["3"] },
            { label: "Trabajo", ids: ["1", "4"] },
            { label: "Sin área", ids: ["2"] }
        ]
    );
});

test("agrupa por contexto y contempla tareas sin contexto", () => {
    const groups = buildTaskGroups(
        [
            { id: "1", contextId: null },
            { id: "2", contextId: "c" }
        ],
        TaskGrouping.CONTEXT,
        {
            contexts: [
                { id: "c", name: "Computadora" }
            ]
        }
    );

    assert.deepEqual(
        groups.map(group => group.label),
        ["Computadora", "Sin contexto"]
    );
});

test("agrupa subtareas con su proyecto raíz y deja tareas simples en Sin proyecto", () => {
    const project = {
        id: "p",
        title: "Mudanza",
        isProject: true,
        parentTaskId: null
    };
    const child = {
        id: "c",
        title: "Comprar cajas",
        isProject: false,
        parentTaskId: "p"
    };
    const simple = {
        id: "s",
        title: "Llamar",
        isProject: false,
        parentTaskId: null
    };

    const groups = buildTaskGroups(
        [child, simple, project],
        TaskGrouping.PROJECT,
        { allTasks: [project, child, simple] }
    );

    assert.deepEqual(
        groups.map(group => ({
            label: group.label,
            ids: group.tasks.map(task => task.id)
        })),
        [
            { label: "Mudanza", ids: ["c", "p"] },
            { label: "Sin proyecto", ids: ["s"] }
        ]
    );
});
