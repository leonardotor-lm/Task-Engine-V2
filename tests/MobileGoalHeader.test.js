import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const goalView = await readFile(
    new URL(
        "../src/ui/GoalView.js",
        import.meta.url
    ),
    "utf8"
);

const styles = await readFile(
    new URL(
        "../styles.css",
        import.meta.url
    ),
    "utf8"
);

const projectView = await readFile(
    new URL(
        "../src/ui/ProjectView.js",
        import.meta.url
    ),
    "utf8"
);

test("el encabezado del objetivo ofrece crear una tarea y editar", () => {

    assert.doesNotMatch(goalView, /id="backToParentGoal"/);
    assert.doesNotMatch(goalView, /id="closeGoalView"/);
    assert.match(goalView, /id="editGoal"/);
    assert.match(goalView, /id="openGoalTaskCreation"/);
    assert.equal(
        goalView.match(/goalHeadingAction/g)?.length,
        2
    );

});

test("la navegación jerárquica queda concentrada en el breadcrumb", () => {

    assert.match(goalView, /id="goalBreadcrumbRoot"/);
    assert.match(goalView, /goalBreadcrumbGoal/);
    assert.match(goalView, /aria-current="page"/);

});

test("el proyecto elimina Volver al incorporar breadcrumb", () => {

    assert.doesNotMatch(
        projectView,
        /id="closeProjectView"/
    );
    assert.match(
        projectView,
        /id="projectBreadcrumbRoot"/
    );
    assert.equal(
        projectView.match(/projectHeadingAction/g)?.length,
        2
    );
    assert.match(
        styles,
        /\.taskListHeading:has\(\.projectHeadingAction\)/
    );
    assert.match(
        projectView,
        /id="toggleBulkMode"[\s\S]*?class="secondaryAction projectBulkModeAction responsiveIconButton[\s\S]*?aria-pressed=/
    );
    assert.match(
        projectView,
        /Icon\.render\("list-checks"\)/
    );

});

test("apila el encabezado del objetivo sólo en móvil", () => {

    const mobileRule =
        styles.indexOf(
            ".taskListHeading:has(.goalHeadingAction)"
        );

    const goalMediaRule =
        styles.lastIndexOf(
            "@media (max-width: 760px)",
            mobileRule
        );

    assert.notEqual(mobileRule, -1);
    assert.notEqual(goalMediaRule, -1);
    assert.ok(goalMediaRule < mobileRule);
    assert.match(
        styles.slice(mobileRule),
        /grid-template-columns:\s*minmax\(0, 1fr\)/
    );

});
