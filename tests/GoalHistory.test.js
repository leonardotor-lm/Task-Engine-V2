import test from "node:test";
import assert from "node:assert/strict";

import { GoalStatus } from "../src/domain/GoalStatus.js";
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

test("clasifica objetivos por estado", () => {

    installLocalStorage();

    const service = new GoalService();
    const completed =
        service.createGoal({ title: "Completado" });
    const archived =
        service.createGoal({ title: "Archivado" });
    const deleted =
        service.createGoal({ title: "Eliminado" });

    service.completeGoal(completed.id);
    service.archiveGoal(archived.id);
    service.deleteGoal(deleted.id);

    assert.equal(service.getCompletedGoals().length, 1);
    assert.equal(service.getArchivedGoals().length, 1);
    assert.equal(service.getDeletedGoals().length, 1);

});

test("envía y restaura un árbol completo desde la papelera", () => {

    installLocalStorage();

    const service = new GoalService();
    const parent =
        service.createGoal({ title: "Principal" });
    const child = service.createGoal({
        title: "Subobjetivo",
        parentGoalId: parent.id
    });

    service.deleteGoal(parent.id);

    assert.equal(parent.status, GoalStatus.DELETED);
    assert.equal(child.status, GoalStatus.DELETED);

    service.restoreDeletedGoal(parent.id);

    assert.equal(parent.status, GoalStatus.ACTIVE);
    assert.equal(child.status, GoalStatus.ACTIVE);

});

test("restaura el estado anterior del objetivo", () => {

    installLocalStorage();

    const service = new GoalService();
    const goal =
        service.createGoal({ title: "Finalizado" });

    service.completeGoal(goal.id);
    service.deleteGoal(goal.id);
    service.restoreDeletedGoal(goal.id);

    assert.equal(goal.status, GoalStatus.COMPLETED);
    assert.notEqual(goal.completedAt, null);

});

test("elimina definitivamente sólo desde la papelera", () => {

    installLocalStorage();

    const service = new GoalService();
    const parent =
        service.createGoal({ title: "Principal" });
    const child = service.createGoal({
        title: "Subobjetivo",
        parentGoalId: parent.id
    });

    assert.throws(
        () =>
            service.permanentlyDeleteGoal(parent.id),
        /papelera/
    );

    service.deleteGoal(parent.id);
    service.permanentlyDeleteGoal(parent.id);

    assert.equal(
        service.getGoalById(parent.id),
        null
    );
    assert.equal(
        service.getGoalById(child.id),
        null
    );

});
