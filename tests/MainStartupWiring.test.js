import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el controlador de reconciliación continua se inicia con la referencia declarada", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );

    assert.match(
        main,
        /const ongoingSyncReconciliationController\s*=\s*\n?\s*new OngoingSyncReconciliationController\(app\);/
    );

    assert.match(
        main,
        /ongoingSyncReconciliationController\s*\n?\s*\.start\(\);/
    );

    assert.doesNotMatch(
        main,
        /\ngoingSyncReconciliationController\.start\(\);/
    );

});
