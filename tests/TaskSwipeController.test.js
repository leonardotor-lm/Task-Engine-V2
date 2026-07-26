import test from "node:test";
import assert from "node:assert/strict";

import {
    SwipeAction,
    TaskSwipeController
} from "../src/ui/TaskSwipeController.js";

const controller =
    new TaskSwipeController();

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
