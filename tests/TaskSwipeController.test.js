import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    SwipeAction,
    TaskSwipeController
} from "../src/ui/TaskSwipeController.js";

const controller =
    new TaskSwipeController();

function createNoticeEnvironment() {

    const listeners = new Map();
    const buttons = new Map(
        [
            ".undoTaskCompletion",
            ".closeTaskCompletionNotice"
        ].map(selector => [
            selector,
            {
                addEventListener(type, handler) {
                    listeners.set(
                        `${selector}:${type}`,
                        handler
                    );
                }
            }
        ])
    );
    let currentNotice = null;

    const notice = {
        id: "",
        className: "",
        innerHTML: "",
        removed: false,
        attributes: new Map(),
        setAttribute(name, value) {
            this.attributes.set(name, value);
        },
        querySelector(selector) {
            return buttons.get(selector);
        },
        remove() {
            this.removed = true;
            currentNotice = null;
        }
    };

    return {
        documentRef: {
            getElementById() {
                return currentNotice;
            },
            createElement() {
                return notice;
            },
            body: {
                appendChild(element) {
                    currentNotice = element;
                }
            }
        },
        listeners,
        notice
    };

}

test("deslizar suficientemente a la derecha completa", () => {

    assert.equal(
        controller.getAction(80, 8),
        SwipeAction.COMPLETE
    );

});

test("deslizar suficientemente a la izquierda abre acciones", () => {

    assert.equal(
        controller.getAction(-80, 8),
        SwipeAction.OPEN_ACTIONS
    );

});

test("un gesto corto no ejecuta acciones", () => {

    assert.equal(
        controller.getAction(40, 3),
        null
    );

});

test("un desplazamiento principalmente vertical no ejecuta acciones", () => {

    assert.equal(
        controller.getAction(80, 75),
        null
    );

});

test("el aviso permanece hasta deshacer o cerrar", async t => {

    const previousDocument = globalThis.document;
    const environment = createNoticeEnvironment();

    globalThis.document = environment.documentRef;
    t.after(() => {
        globalThis.document = previousDocument;
    });

    let undoneTaskId = null;

    controller.showCompletionNotice(
        "task-1",
        id => {
            undoneTaskId = id;
            return true;
        }
    );

    assert.match(
        environment.notice.innerHTML,
        /Tarea completada[\s\S]*Deshacer[\s\S]*Cerrar/
    );
    assert.equal(
        environment.notice.removed,
        false
    );

    await environment.listeners.get(
        ".undoTaskCompletion:click"
    )();

    assert.equal(undoneTaskId, "task-1");
    assert.equal(
        environment.notice.removed,
        true
    );

});

test("el aviso puede cerrarse sin deshacer", t => {

    const previousDocument = globalThis.document;
    const environment = createNoticeEnvironment();

    globalThis.document = environment.documentRef;
    t.after(() => {
        globalThis.document = previousDocument;
    });

    controller.showCompletionNotice(
        "task-2",
        () => true
    );

    environment.listeners.get(
        ".closeTaskCompletionNotice:click"
    )();

    assert.equal(
        environment.notice.removed,
        true
    );

});

test("la casilla reutiliza el aviso en escritorio y celular", async () => {

    const mainView = await readFile(
        new URL(
            "../src/ui/MainView.js",
            import.meta.url
        ),
        "utf8"
    );
    const swipeController = await readFile(
        new URL(
            "../src/ui/TaskSwipeController.js",
            import.meta.url
        ),
        "utf8"
    );
    const styles = await readFile(
        new URL("../styles.css", import.meta.url),
        "utf8"
    );

    assert.match(
        mainView,
        /taskCompleteCheckbox[\s\S]*?showCompletionNotice/
    );
    assert.doesNotMatch(
        swipeController,
        /setTimeout\([\s\S]*?5000/
    );
    assert.ok(
        styles.indexOf(".taskCompletionNotice {") <
            styles.indexOf(
                "/* Correcciones de interacción móvil */"
            )
    );

});
