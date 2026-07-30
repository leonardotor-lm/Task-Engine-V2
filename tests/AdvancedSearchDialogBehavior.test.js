import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const appSource = await readFile(
    new URL("../src/core/App.js", import.meta.url),
    "utf8"
);

const mainViewSource = await readFile(
    new URL("../src/ui/MainView.js", import.meta.url),
    "utf8"
);

test("la búsqueda simple y la avanzada mantienen flujos separados", () => {

    assert.match(
        mainViewSource,
        /onSearchSimpleTasks\(query\)/
    );
    assert.match(
        mainViewSource,
        /onSearchTasks\(query\)/
    );
    assert.match(
        appSource,
        /onSearchSimpleTasks:[\s\S]*?advancedSearchMode = false/
    );

});

test("una búsqueda avanzada válida cierra el panel", () => {

    assert.match(
        appSource,
        /compileAdvancedSearch\(query\);[\s\S]*?advancedSearchDialogOpen =\s*false/
    );
    assert.match(
        appSource,
        /catch \(error\)[\s\S]*?advancedSearchDialogOpen =\s*true/
    );

});

test("el diálogo se abre como modal y puede cancelarse", () => {

    assert.match(
        mainViewSource,
        /advancedSearchDialog\.showModal\(\)/
    );
    assert.match(
        mainViewSource,
        /"cancel",[\s\S]*?event\.preventDefault\(\);[\s\S]*?closeAdvancedSearch\(\)/
    );
    assert.match(
        mainViewSource,
        /const closeAdvancedSearch =[\s\S]*?onCloseAdvancedSearch\(\)/
    );

});
