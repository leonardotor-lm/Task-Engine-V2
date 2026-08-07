import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";


test("la vista de proyectos habilita el modo de selección múltiple activo", async () => {

    const appSource = await readFile(
        new URL("../src/core/App.js", import.meta.url),
        "utf8"
    );
    const projectViewSource = await readFile(
        new URL("../src/ui/ProjectView.js", import.meta.url),
        "utf8"
    );

    assert.match(
        appSource,
        /\[View\.PROJECT\]:\s*"ACTIVE"/
    );

    assert.match(
        projectViewSource,
        /id="toggleBulkMode"/
    );
    assert.match(
        projectViewSource,
        /state\.selectedTaskIds,\s*\n\s*state\.bulkSelectionEnabled,\s*\n\s*state\.bulkActionMode/
    );
    assert.match(
        projectViewSource,
        /state\.goals,\s*\n\s*"projectWorkspace"/
    );

});
