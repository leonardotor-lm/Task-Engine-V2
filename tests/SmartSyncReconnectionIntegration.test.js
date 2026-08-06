import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mainSource = await readFile(
    new URL("../src/main.js", import.meta.url),
    "utf8"
);

const configSource = await readFile(
    new URL(
        "../src/infrastructure/SyncConfig.js",
        import.meta.url
    ),
    "utf8"
);

test("la aplicación inicia la reconciliación inteligente después de preparar los datos opcionales", () => {

    assert.match(
        mainSource,
        /SmartSyncReconnectionController/
    );
    assert.match(
        mainSource,
        /syncOptionalDataBridge\.start\(\);[\s\S]*?smartSyncReconnectionController\.start\(\);[\s\S]*?app\.start\(\);/
    );

});

test("desconectar conserva el estado y ofrece una eliminación explícita del vínculo", () => {

    assert.match(
        configSource,
        /clear\(\)[\s\S]*?removeItem\(SYNC_URL_KEY\)[\s\S]*?removeItem\(SYNC_TOKEN_KEY\)/
    );
    assert.doesNotMatch(
        configSource,
        /clear\(\)[\s\S]*?clearSyncState\(\)[\s\S]*?getRevision\(\)/
    );
    assert.match(
        configSource,
        /forgetEndpoint\(\)[\s\S]*?clearSyncState\(\)/
    );

});
