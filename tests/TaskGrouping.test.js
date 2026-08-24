import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
    TASK_GROUPING_PREFERENCES_STORAGE_KEY,
    TaskGrouping,
    TaskGroupingPreferencesRepository
} from "../src/infrastructure/TaskGroupingPreferencesRepository.js";
import {
    buildContextGroupingRenderState,
    buildTaskGroups,
    TaskGroupingController
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

test("al agrupar por contexto separa padre e hijo cuando tienen contextos distintos", () => {
    const project = {
        id: "p",
        title: "Mudanza",
        contextId: "trabajo",
        parentTaskId: null,
        isProject: true
    };
    const child = {
        id: "c",
        title: "Comprar cajas",
        contextId: "casa",
        parentTaskId: "p",
        isProject: false
    };

    const groups = buildTaskGroups(
        [project, child],
        TaskGrouping.CONTEXT,
        {
            contexts: [
                { id: "casa", name: "Casa" },
                { id: "trabajo", name: "Trabajo" }
            ],
            allTasks: [project, child]
        }
    );

    assert.deepEqual(
        groups.map(group => ({
            label: group.label,
            ids: group.tasks.map(task => task.id)
        })),
        [
            { label: "Casa", ids: ["c"] },
            { label: "Trabajo", ids: ["p"] }
        ]
    );
});

test("al agrupar por contexto mantiene juntos padre e hijo cuando comparten contexto", () => {
    const project = {
        id: "p",
        contextId: "c",
        parentTaskId: null,
        isProject: true
    };
    const child = {
        id: "h",
        contextId: "c",
        parentTaskId: "p",
        isProject: false
    };

    const groups = buildTaskGroups(
        [project, child],
        TaskGrouping.CONTEXT,
        {
            contexts: [
                { id: "c", name: "Computadora" }
            ],
            allTasks: [project, child]
        }
    );

    assert.deepEqual(
        groups.map(group => ({
            label: group.label,
            ids: group.tasks.map(task => task.id)
        })),
        [
            { label: "Computadora", ids: ["p", "h"] }
        ]
    );
});

test("al agrupar por contexto fuerza sólo las ramas necesarias y conserva la visibilidad original", () => {
    const tasks = [
        {
            id: "p",
            contextId: "trabajo",
            parentTaskId: null
        },
        {
            id: "same",
            contextId: "trabajo",
            parentTaskId: "p"
        },
        {
            id: "different",
            contextId: "casa",
            parentTaskId: "p"
        }
    ];

    const state = buildContextGroupingRenderState(
        tasks,
        new Set()
    );

    assert.deepEqual(
        [...state.originallyVisibleTaskIds],
        ["p"]
    );
    assert.deepEqual(
        [...state.forcedVisibleTaskIds],
        ["different"]
    );
    assert.deepEqual(
        [...state.renderExpandedTaskIds],
        ["p"]
    );
});

test("al agrupar por contexto expande sólo el render de TaskList sin envolver MainView", () => {
    let receivedExpandedTaskIds = "not-called";
    const taskList = {
        render(...args) {
            receivedExpandedTaskIds = args[7];
            return "ok";
        }
    };
    const mainView = {
        render() {
            return "main";
        },
        viewRouter: {
            taskList
        }
    };
    const originalMainRender = mainView.render;
    const app = {
        currentView: "TODAY",
        mainView
    };
    const repository = {
        get() {
            return TaskGrouping.CONTEXT;
        }
    };
    const controller = new TaskGroupingController(
        app,
        {
            repository,
            documentRef: null
        }
    );

    controller.wrapTaskListRender();
    taskList.render(
        [
            {
                id: "p",
                contextId: "trabajo",
                parentTaskId: null
            },
            {
                id: "c",
                contextId: "casa",
                parentTaskId: "p"
            }
        ],
        "Hoy",
        false,
        [],
        [],
        [],
        "",
        new Set()
    );

    assert.ok(receivedExpandedTaskIds instanceof Set);
    assert.deepEqual(
        [...receivedExpandedTaskIds],
        ["p"]
    );
    assert.equal(mainView.render, originalMainRender);
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

test("inserta el selector de agrupación inmediatamente después del selector de orden y sin título visible", async () => {
    const source = await fs.readFile(
        new URL(
            "../src/ui/TaskGroupingController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /sortControl\.insertAdjacentElement\(\s*"afterend",\s*wrapper/
    );
    assert.match(
        source,
        /id="taskGrouping"/
    );
    assert.doesNotMatch(
        source,
        /<span>Agrupar<\/span>/
    );
    assert.doesNotMatch(
        source,
        /#taskToolsDialog \.taskViewOptionsBody/
    );
});

test("muestra breadcrumb y elimina la sangría cuando el contexto separa una subtarea de su padre", async () => {
    const source = await fs.readFile(
        new URL(
            "../src/ui/TaskGroupingController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /grouping === TaskGrouping\.CONTEXT/
    );
    assert.match(
        source,
        /groupKeyByTaskId\.get\(task\.parentTaskId\)/
    );
    assert.match(
        source,
        /groupingHierarchyPath/
    );
    assert.match(
        source,
        /"--task-depth",\s*"0"/
    );
    assert.match(
        source,
        /row\.style\.borderLeft = "0"/
    );
});

test("advierte filtros activos y ofrece limpiarlos desde la barra", async () => {
    const source = await fs.readFile(
        new URL(
            "../src/ui/TaskGroupingController.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /Filtros activos · Limpiar/
    );
    assert.match(
        source,
        /onClearTaskFilters/
    );
});
