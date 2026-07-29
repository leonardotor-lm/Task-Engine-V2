import test from "node:test";
import assert from "node:assert/strict";

import { Goal } from "../src/domain/Goal.js";
import { GoalList } from "../src/ui/GoalList.js";

test("prioriza el estado vacío y ofrece crear bajo demanda", () => {

    const html = new GoalList().render([]);

    assert.match(html, /id="openGoalCreation"/);
    assert.doesNotMatch(html, /id="goalForm"/);
    assert.match(
        html,
        /Aún no fijaste ningún objetivo/
    );

});

test("muestra el formulario sólo cuando se solicita", () => {

    const html = new GoalList().render(
        [],
        undefined,
        true
    );

    assert.match(html, /id="goalForm"/);
    assert.match(html, /id="cancelGoalCreation"/);
    assert.doesNotMatch(html, /id="openGoalCreation"/);

});

test("muestra objetivos y subobjetivos", () => {

    const parent = new Goal({
        id: "goal-parent",
        title: "Mejorar la propuesta docente",
        dueDate: "2026-12-15"
    });

    const child = new Goal({
        title: "Actualizar materiales",
        parentGoalId: parent.id
    });

    const html = new GoalList().render([
        parent,
        child
    ]);

    assert.match(
        html,
        /Mejorar la propuesta docente/
    );
    assert.match(html, /Actualizar materiales/);
    assert.match(html, /15\/12\/2026/);
    assert.match(html, /goalChildren/);

});

test("escapa el contenido ingresado", () => {

    const html = new GoalList().render([
        new Goal({
            title: "<script>Objetivo</script>",
            description: "<img src=x>"
        })
    ]);

    assert.doesNotMatch(html, /<script>/);
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /&lt;script&gt;/);

});
