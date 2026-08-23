import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("aiStatus reenvía proveedor y modelo seleccionados a Apps Script", async () => {
    const code = await fs.readFile("google-apps-script/Code.gs", "utf8");
    assert.match(code, /getAiStatus_\([\s\S]*?body\.provider,[\s\S]*?body\.model/);
});

test("Apps Script aísla errores por proveedor y respeta el modelo solicitado", async () => {
    const ai = await fs.readFile("google-apps-script/AI.gs", "utf8");
    assert.match(ai, /function getAiStatus_\(validateRemote, provider, model\)/);
    assert.match(ai, /try \{[\s\S]*?getAiProviderStatus_/);
    assert.match(ai, /catch \(error\)/);
    assert.match(ai, /function getAiProviderStatus_\(provider, validateRemote, model\)/);
    assert.match(ai, /normalizeAiModel_\(providerId, model\)/);
});

test("Configuración verifica sólo el proveedor y modelo activos", async () => {
    const ui = await fs.readFile("src/ui/AiSettingsController.js", "utf8");
    assert.match(ui, /provider: this\.app\.aiPreferences\.getProvider\(\)/);
    assert.match(ui, /model: this\.app\.aiPreferences\.getModel\(\)/);
    assert.match(ui, /selectedStatus\?\.error/);
});
