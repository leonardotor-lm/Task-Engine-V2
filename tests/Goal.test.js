import test from "node:test";
import assert from "node:assert/strict";

import { Goal } from "../src/domain/Goal.js";
import { GoalStatus } from "../src/domain/GoalStatus.js";
import { GoalRepository } from "../src/infrastructure/GoalRepository.js";
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

test("crea un objetivo activo con fecha límite optativa", () => {

    const goal = new Goal({
        title: "Terminar planificación anual",
        description: "Completar todos los cursos",
        dueDate: "2026-12-15"
    });

    assert.equal(goal.status, GoalStatus.ACTIVE);
    assert.equal(goal.dueDate, "2026-12-15");
    assert.equal(goal.parentGoalId, null);

});

test("no permite crear un objetivo sin título", () => {

    assert.throws(
        () => new Goal({ title: "   " }),
        {
            message:
                "El título del objetivo no puede estar vacío."
        }
    );

});

test("completa y reabre un objetivo", () => {

    const goal = new Goal({
        title: "Publicar materiales"
    });

    goal.complete();

    assert.equal(goal.status, GoalStatus.COMPLETED);
    assert.notEqual(goal.completedAt, null);

    goal.reopen();

    assert.equal(goal.status, GoalStatus.ACTIVE);
    assert.equal(goal.completedAt, null);

});

test("archiva y restaura un objetivo", () => {

    const goal = new Goal({
        title: "Objetivo suspendido"
    });

    goal.archive();

    assert.equal(goal.status, GoalStatus.ARCHIVED);

    goal.restoreFromArchive();

    assert.equal(goal.status, GoalStatus.ACTIVE);

});

test("admite subobjetivos pero no autorreferencias", () => {

    const goal = new Goal({
        id: "goal-1",
        title: "Objetivo principal"
    });

    goal.update({
        parentGoalId: "goal-parent"
    });

    assert.equal(
        goal.parentGoalId,
        "goal-parent"
    );

    assert.throws(
        () => goal.update({
            parentGoalId: "goal-1"
        }),
        {
            message:
                "Un objetivo no puede ser su propio objetivo principal."
        }
    );

});

test("persiste y reconstruye objetivos", () => {

    installLocalStorage();

    const repository = new GoalRepository();

    const goal = repository.add({
        title: "Leer veinte libros"
    });

    const reloadedRepository =
        new GoalRepository();

    const reloadedGoal =
        reloadedRepository.getById(goal.id);

    assert.ok(reloadedGoal instanceof Goal);
    assert.equal(
        reloadedGoal.title,
        "Leer veinte libros"
    );

});

test("el servicio actualiza y guarda el objetivo", () => {

    installLocalStorage();

    const service = new GoalService();

    const goal = service.createGoal({
        title: "Objetivo inicial"
    });

    service.updateGoal(goal.id, {
        title: "Objetivo actualizado"
    });

    const reloaded =
        new GoalRepository().getById(goal.id);

    assert.equal(
        reloaded.title,
        "Objetivo actualizado"
    );

    assert.equal(reloaded.version, 2);

});
