import test from "node:test";
import assert from "node:assert/strict";

import { Goal } from "../src/domain/Goal.js";
import { GoalStatus } from "../src/domain/GoalStatus.js";
import { GoalList } from "../src/ui/GoalList.js";

function goal(status, title = status) {
    return new Goal({
        title,
        status
    });
}

test("muestra las cuatro secciones", () => {

    const html = new GoalList().render([]);

    for (const label of [
        "Activos",
        "Completados",
        "Archivados",
        "Papelera"
    ]) {
        assert.match(html, new RegExp(label));
    }

});

test("muestra sólo los objetivos del estado elegido", () => {

    const html = new GoalList().render(
        [
            goal(
                GoalStatus.ACTIVE,
                "Activo único"
            ),
            goal(
                GoalStatus.ARCHIVED,
                "Archivado único"
            )
        ],
        GoalStatus.ARCHIVED
    );

    assert.match(html, /Archivado único/);
    assert.doesNotMatch(html, /Activo único/);

});

test("ofrece acciones adecuadas en papelera", () => {

    const html = new GoalList().render(
        [goal(GoalStatus.DELETED)],
        GoalStatus.DELETED
    );

    assert.match(html, /restoreDeletedGoal/);
    assert.match(html, /permanentlyDeleteGoal/);
    assert.doesNotMatch(html, /openGoal/);

});
