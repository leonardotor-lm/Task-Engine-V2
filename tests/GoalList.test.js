import test from "node:test";
import assert from "node:assert/strict";

import { Goal } from "../src/domain/Goal.js";
import { GoalList } from "../src/ui/GoalList.js";

test("muestra el formulario y el estado vacío", () => {

    const html = new GoalList().render([]);

    assert.match(html, /id="goalForm"/);
    assert.match(
        html,
        /No hay objetivos activos/
    );

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
