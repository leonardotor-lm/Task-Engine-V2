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

test("identifica las acciones del encabezado de objetivos", () => {

    assert.equal(
        goalView.match(/goalHeadingAction/g)?.length,
        2
    );

});

test("aplica el mismo encabezado responsive a proyectos", () => {

    assert.equal(
        projectView.match(/projectHeadingAction/g)?.length,
        3
    );
    assert.match(
        styles,
        /\.taskListHeading:has\(\.projectHeadingAction\)/
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
