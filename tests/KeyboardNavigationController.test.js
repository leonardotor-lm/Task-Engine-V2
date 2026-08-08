import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    KeyboardNavigationController
} from "../src/ui/KeyboardNavigationController.js";

function createEvent(key, target) {
    return {
        key,
        target,
        prevented: false,
        stopped: false,
        preventDefault() {
            this.prevented = true;
        },
        stopPropagation() {
            this.stopped = true;
        }
    };
}

function createToggle(expanded) {
    const attrs = new Map([
        ["aria-expanded", expanded]
    ]);

    return {
        clicked: 0,
        getAttribute(name) {
            return attrs.get(name) ?? null;
        },
        setAttribute(name, value) {
            attrs.set(name, value);
        },
        click() {
            this.clicked += 1;
            attrs.set(
                "aria-expanded",
                attrs.get("aria-expanded") === "true"
                    ? "false"
                    : "true"
            );
        }
    };
}

function createRow(
    id,
    {
        project = false,
        expanded = null,
        title = id
    } = {}
) {
    const attrs = new Map();
    const listeners = new Map();
    const toggle = expanded === null
        ? null
        : createToggle(expanded);

    return {
        dataset: { id },
        clicked: 0,
        focused: 0,
        scrolled: 0,
        classList: {
            contains(name) {
                return project &&
                    name === "projectTask";
            }
        },
        setAttribute(name, value) {
            attrs.set(name, String(value));
        },
        getAttribute(name) {
            return attrs.get(name) ?? null;
        },
        addEventListener(type, handler) {
            listeners.set(type, handler);
        },
        listener(type) {
            return listeners.get(type);
        },
        querySelector(selector) {
            if (selector === ".toggleSubtasks") {
                return toggle;
            }
            if (selector === ".taskTitle") {
                return { textContent: title };
            }
            return null;
        },
        focus() {
            this.focused += 1;
        },
        scrollIntoView() {
            this.scrolled += 1;
        },
        click() {
            this.clicked += 1;
        },
        toggle
    };
}

function createDocument({
    rows = [],
    menus = [],
    goals = [],
    editorInput = null,
    heading = null
} = {}) {
    return {
        querySelectorAll(selector) {
            if (selector === ".task") return rows;
            if (
                selector ===
                    ".quickMoreActions, .quickPostpone"
            ) {
                return menus;
            }
            if (selector === ".openGoal") {
                return goals;
            }
            return [];
        },
        querySelector(selector) {
            if (selector === ".content h2") {
                return heading;
            }
            return null;
        },
        getElementById(id) {
            if (id === "taskTitleEdit") {
                return editorInput;
            }
            return null;
        }
    };
}

function createApp(tasks = {}) {
    return {
        taskService: {
            getTaskById(id) {
                return tasks[id] ?? null;
            }
        },
        mainView: {
            render() {}
        }
    };
}

test("vuelve enfocables las filas y expone una instrucción accesible", () => {
    const row = createRow(
        "t1",
        { title: "Comprar pan" }
    );
    const controller = new KeyboardNavigationController(
        createApp({
            t1: {
                id: "t1",
                title: "Comprar pan"
            }
        }),
        {
            documentRef: createDocument({
                rows: [row]
            })
        }
    );

    controller.bindTaskRows();

    assert.equal(
        row.getAttribute("tabindex"),
        "0"
    );
    assert.equal(
        row.getAttribute("aria-label"),
        "Tarea: Comprar pan. Enter o espacio para abrir."
    );
    assert.equal(
        typeof row.listener("keydown"),
        "function"
    );
});

test("ArrowDown, ArrowUp, Home y End recorren las tareas visibles", () => {
    const rows = [
        createRow("a"),
        createRow("b"),
        createRow("c")
    ];
    const controller = new KeyboardNavigationController(
        createApp(),
        {
            documentRef: createDocument({ rows })
        }
    );

    let event = createEvent("ArrowDown", rows[1]);
    controller.handleTaskKeydown(event, rows[1]);
    assert.equal(rows[2].focused, 1);
    assert.equal(event.prevented, true);

    event = createEvent("ArrowUp", rows[1]);
    controller.handleTaskKeydown(event, rows[1]);
    assert.equal(rows[0].focused, 1);

    event = createEvent("Home", rows[2]);
    controller.handleTaskKeydown(event, rows[2]);
    assert.equal(rows[0].focused, 2);

    event = createEvent("End", rows[0]);
    controller.handleTaskKeydown(event, rows[0]);
    assert.equal(rows[2].focused, 2);
});

test("Enter y espacio activan la fila y mueven el foco al destino", () => {
    const taskRow = createRow("t1");
    const projectRow = createRow(
        "p1",
        { project: true }
    );
    const editorInput = {
        focused: 0,
        focus() {
            this.focused += 1;
        }
    };
    const heading = {
        focused: 0,
        tabindex: null,
        setAttribute(name, value) {
            if (name === "tabindex") {
                this.tabindex = value;
            }
        },
        focus() {
            this.focused += 1;
        }
    };
    const controller = new KeyboardNavigationController(
        createApp(),
        {
            documentRef: createDocument({
                rows: [taskRow, projectRow],
                editorInput,
                heading
            })
        }
    );

    let event = createEvent("Enter", taskRow);
    controller.handleTaskKeydown(event, taskRow);
    assert.equal(taskRow.clicked, 1);
    assert.equal(editorInput.focused, 1);

    event = createEvent(" ", projectRow);
    controller.handleTaskKeydown(
        event,
        projectRow
    );
    assert.equal(projectRow.clicked, 1);
    assert.equal(heading.focused, 1);
    assert.equal(heading.tabindex, "-1");
});

test("ArrowRight expande o entra al primer hijo visible", () => {
    const parent = createRow(
        "p",
        {
            project: true,
            expanded: "false"
        }
    );
    const child = createRow("c");
    const tasks = {
        p: { id: "p", parentTaskId: null },
        c: { id: "c", parentTaskId: "p" }
    };
    const rows = [parent, child];
    const controller = new KeyboardNavigationController(
        createApp(tasks),
        {
            documentRef: createDocument({ rows })
        }
    );

    let event = createEvent(
        "ArrowRight",
        parent
    );
    controller.handleTaskKeydown(event, parent);
    assert.equal(parent.toggle.clicked, 1);
    assert.equal(parent.focused, 1);

    parent.toggle.setAttribute(
        "aria-expanded",
        "true"
    );
    event = createEvent("ArrowRight", parent);
    controller.handleTaskKeydown(event, parent);
    assert.equal(child.focused, 1);
});

test("ArrowLeft contrae o vuelve al padre visible", () => {
    const parent = createRow(
        "p",
        {
            project: true,
            expanded: "true"
        }
    );
    const child = createRow("c");
    const tasks = {
        p: { id: "p", parentTaskId: null },
        c: { id: "c", parentTaskId: "p" }
    };
    const rows = [parent, child];
    const controller = new KeyboardNavigationController(
        createApp(tasks),
        {
            documentRef: createDocument({ rows })
        }
    );

    let event = createEvent(
        "ArrowLeft",
        parent
    );
    controller.handleTaskKeydown(event, parent);
    assert.equal(parent.toggle.clicked, 1);
    assert.equal(parent.focused, 1);

    event = createEvent("ArrowLeft", child);
    controller.handleTaskKeydown(event, child);
    assert.equal(parent.focused, 2);
});

test("Escape cierra el menú rápido activo y devuelve el foco al summary", () => {
    const summary = {
        focused: 0,
        focus() {
            this.focused += 1;
        }
    };
    const listeners = new Map();
    const menu = {
        open: true,
        addEventListener(type, handler) {
            listeners.set(type, handler);
        },
        querySelector(selector) {
            return selector === ":scope > summary"
                ? summary
                : null;
        }
    };
    const controller = new KeyboardNavigationController(
        createApp(),
        {
            documentRef: createDocument({
                menus: [menu]
            })
        }
    );

    controller.bindQuickMenus();

    const event = createEvent(
        "Escape",
        menu
    );
    listeners.get("keydown")(event);

    assert.equal(menu.open, false);
    assert.equal(summary.focused, 1);
    assert.equal(event.prevented, true);
    assert.equal(event.stopped, true);
});

test("las flechas recorren objetivos sin alterar su activación nativa", () => {
    const listeners = new Map();
    const goal = () => ({
        focused: 0,
        addEventListener(type, handler) {
            listeners.set(this, handler);
        },
        focus() {
            this.focused += 1;
        }
    });
    const goals = [goal(), goal(), goal()];
    const controller = new KeyboardNavigationController(
        createApp(),
        {
            documentRef: createDocument({ goals })
        }
    );

    controller.bindGoalNavigation();

    let event = createEvent(
        "ArrowDown",
        goals[1]
    );
    listeners.get(goals[1])(event);
    assert.equal(goals[2].focused, 1);

    event = createEvent("Home", goals[2]);
    listeners.get(goals[2])(event);
    assert.equal(goals[0].focused, 1);
});

test("el controlador se ejecuta después de cada render y está cableado en main", async () => {
    const app = createApp();
    const documentRef = createDocument();
    const controller = new KeyboardNavigationController(
        app,
        { documentRef }
    );
    let binds = 0;
    controller.bind = () => {
        binds += 1;
    };

    controller.start();
    app.mainView.render({});
    assert.equal(binds, 1);

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );

    assert.match(
        main,
        /KeyboardNavigationController/
    );
    assert.match(
        main,
        /accessibilityStateController\.start\(\);\s*keyboardNavigationController\.start\(\);/
    );
});
