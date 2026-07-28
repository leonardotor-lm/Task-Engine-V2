import test from "node:test";
import assert from "node:assert/strict";

import { GoalService } from "../src/core/GoalService.js";

function installLocalStorage() {

    const values = new Map();

    globalThis.localStorage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) =>
            values.set(key, String(value)),
        removeItem: key => values.delete(key),
        clear: () => values.clear()
    };

}

test("crea un subobjetivo sólo con un padre existente", () => {

    installLocalStorage();

    const service = new GoalService();

    const parent = service.createGoal({
        title: "Objetivo principal"
    });

    const child = service.createGoal({
        title: "Subobjetivo",
        parentGoalId: parent.id
    });

    assert.equal(child.parentGoalId, parent.id);

    assert.throws(
        () => service.createGoal({
            title: "Subobjetivo huérfano",
            parentGoalId: "missing"
        }),
        {
            message: "Objetivo inexistente."
        }
    );

});

test("obtiene subobjetivos directos y descendientes", () => {

    installLocalStorage();

    const service = new GoalService();

    const root = service.createGoal({
        title: "Raíz"
    });

    const child = service.createGoal({
        title: "Hijo",
        parentGoalId: root.id
    });

    const grandchild = service.createGoal({
        title: "Nieto",
        parentGoalId: child.id
    });

    assert.deepEqual(
        service
            .getDirectSubgoals(root.id)
            .map(goal => goal.id),
        [child.id]
    );

    assert.deepEqual(
        service
            .getDescendants(root.id)
            .map(goal => goal.id),
        [child.id, grandchild.id]
    );

});

test("impide ciclos al mover objetivos", () => {

    installLocalStorage();

    const service = new GoalService();

    const root = service.createGoal({
        title: "Raíz"
    });

    const child = service.createGoal({
        title: "Hijo",
        parentGoalId: root.id
    });

    const grandchild = service.createGoal({
        title: "Nieto",
        parentGoalId: child.id
    });

    assert.throws(
        () => service.moveGoal(
            root.id,
            grandchild.id
        ),
        {
            message:
                "No se puede mover un objetivo dentro de uno de sus descendientes."
        }
    );

    assert.equal(root.parentGoalId, null);

});

test("mueve e independiza un subobjetivo", () => {

    installLocalStorage();

    const service = new GoalService();

    const firstParent = service.createGoal({
        title: "Primer objetivo"
    });

    const secondParent = service.createGoal({
        title: "Segundo objetivo"
    });

    const child = service.createGoal({
        title: "Subobjetivo",
        parentGoalId: firstParent.id
    });

    service.moveGoal(
        child.id,
        secondParent.id
    );

    assert.equal(
        child.parentGoalId,
        secondParent.id
    );

    service.detachGoal(child.id);

    assert.equal(child.parentGoalId, null);

});

test("no elimina un objetivo con subobjetivos", () => {

    installLocalStorage();

    const service = new GoalService();

    const root = service.createGoal({
        title: "Raíz"
    });

    service.createGoal({
        title: "Hijo",
        parentGoalId: root.id
    });

    assert.throws(
        () => service.deleteGoal(root.id),
        {
            message:
                "No se puede eliminar un objetivo que contiene subobjetivos."
        }
    );

});
