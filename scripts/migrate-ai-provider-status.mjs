import fs from "node:fs";

const pending = new Map();

function read(path) {
    return pending.has(path)
        ? pending.get(path)
        : fs.readFileSync(path, "utf8");
}

function replaceOnce(path, from, to) {
    const source = read(path);
    if (source.includes(to) && !source.includes(from)) {
        pending.set(path, source);
        return;
    }
    const count = source.split(from).length - 1;
    if (count !== 1) {
        throw new Error(`Se esperaba exactamente una coincidencia en ${path} y se encontraron ${count}.`);
    }
    pending.set(path, source.replace(from, to));
}

replaceOnce(
    "google-apps-script/Code.gs",
`                getAiStatus_(
                    body.validateRemote === true
                )`,
`                getAiStatus_(
                    body.validateRemote === true,
                    body.provider,
                    body.model
                )`
);

replaceOnce(
    "google-apps-script/AI.gs",
`function getAiStatus_(validateRemote) {
    var providers = {};
    var providerIds = Object.keys(
        TASK_ENGINE_AI_SETTINGS.PROVIDERS
    );

    providerIds.forEach(function(providerId) {
        providers[providerId] = getAiProviderStatus_(
            providerId,
            validateRemote === true
        );
    });

    var defaultStatus = providers[
        TASK_ENGINE_AI_SETTINGS.DEFAULT_PROVIDER
    ];

    return {
        ok: true,
        configured: defaultStatus.configured,
        connected: defaultStatus.connected,
        provider: defaultStatus.provider,
        model: defaultStatus.model,
        providers: providers
    };
}

function getAiProviderStatus_(provider, validateRemote) {
    var providerId = normalizeAiProvider_(provider);
    var settings = getAiProviderSettings_(providerId);
    var apiKey = getAiApiKey_(providerId);
    var model = settings.DEFAULT_MODEL;`,
`function getAiStatus_(validateRemote, provider, model) {
    var providers = {};
    var requestedProvider = String(provider || "").trim();
    var providerIds = requestedProvider
        ? [normalizeAiProvider_(requestedProvider)]
        : Object.keys(TASK_ENGINE_AI_SETTINGS.PROVIDERS);

    providerIds.forEach(function(providerId) {
        try {
            providers[providerId] = getAiProviderStatus_(
                providerId,
                validateRemote === true,
                providerId === normalizeAiProvider_(requestedProvider)
                    ? model
                    : null
            );
        } catch (error) {
            var settings = getAiProviderSettings_(providerId);
            providers[providerId] = {
                configured: Boolean(getAiApiKey_(providerId)),
                connected: false,
                provider: settings.LABEL,
                providerId: providerId,
                model: normalizeAiModel_(providerId, model),
                error:
                    error.publicMessage ||
                    error.message ||
                    "No se pudo verificar el proveedor."
            };
        }
    });

    var selectedProvider = requestedProvider
        ? normalizeAiProvider_(requestedProvider)
        : TASK_ENGINE_AI_SETTINGS.DEFAULT_PROVIDER;
    var selectedStatus = providers[selectedProvider];

    return {
        ok: true,
        configured: selectedStatus.configured,
        connected: selectedStatus.connected,
        provider: selectedStatus.provider,
        providerId: selectedStatus.providerId,
        model: selectedStatus.model,
        error: selectedStatus.error || "",
        providers: providers
    };
}

function getAiProviderStatus_(provider, validateRemote, model) {
    var providerId = normalizeAiProvider_(provider);
    var settings = getAiProviderSettings_(providerId);
    var apiKey = getAiApiKey_(providerId);
    var resolvedModel = normalizeAiModel_(providerId, model);`
);

replaceOnce(
    "google-apps-script/AI.gs",
`            model: model
        };
    }

    if (validateRemote !== true) {
        return {
            configured: true,
            connected: false,
            provider: settings.LABEL,
            providerId: providerId,
            model: model
        };
    }

    if (providerId === "groq") {
        return verifyGroqProvider_(
            apiKey,
            model,
            settings
        );
    }

    var response = UrlFetchApp.fetch(
        settings.API_BASE +
            "/models/" +
            encodeURIComponent(model),`,
`            model: resolvedModel
        };
    }

    if (validateRemote !== true) {
        return {
            configured: true,
            connected: false,
            provider: settings.LABEL,
            providerId: providerId,
            model: resolvedModel
        };
    }

    if (providerId === "groq") {
        return verifyGroqProvider_(
            apiKey,
            resolvedModel,
            settings
        );
    }

    var response = UrlFetchApp.fetch(
        settings.API_BASE +
            "/models/" +
            encodeURIComponent(resolvedModel),`
);

replaceOnce(
    "google-apps-script/AI.gs",
`                .replace(/^models\\//, "") || model,`,
`                .replace(/^models\\//, "") || resolvedModel,`
);

replaceOnce(
    "src/ui/AiSettingsController.js",
`        this.document.getElementById("aiProvider")?.addEventListener("change", event => {
            this.app.aiPreferences.setProvider(event.target.value);
            this.error = "";
            this.renderPanel();
        });`,
`        this.document.getElementById("aiProvider")?.addEventListener("change", event => {
            this.app.aiPreferences.setProvider(event.target.value);
            this.status = null;
            this.error = "";
            this.renderPanel();
            this.refresh(false);
        });`
);

replaceOnce(
    "src/ui/AiSettingsController.js",
`            } else if (selectedStatus?.connected === true) {
                statusClass = "configured";
                statusText = "Conectada";
            } else if (selectedStatus?.configured) {`,
`            } else if (selectedStatus?.error) {
                statusClass = "error";
                statusText = "Error";
            } else if (selectedStatus?.connected === true) {
                statusClass = "configured";
                statusText = "Conectada";
            } else if (selectedStatus?.configured) {`
);

replaceOnce(
    "src/ui/AiSettingsController.js",
`            ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}

            ${status && !status.configured ? ``,
`            ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}
            ${status?.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(status.error)}</p>` : ""}

            ${status && !status.configured ? ``
);

replaceOnce(
    "src/ui/AiSettingsController.js",
`            this.status = await gateway.aiStatus({
                ...connection,
                validateRemote
            });`,
`            this.status = await gateway.aiStatus({
                ...connection,
                validateRemote,
                provider: this.app.aiPreferences.getProvider(),
                model: this.app.aiPreferences.getModel()
            });`
);

const testPath = "tests/AiProviderStatusIsolation.test.js";
const testContent = `import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs/promises";\n\ntest("aiStatus reenvía proveedor y modelo seleccionados a Apps Script", async () => {\n    const code = await fs.readFile("google-apps-script/Code.gs", "utf8");\n    assert.match(code, /getAiStatus_\\([\\s\\S]*?body\\.provider,[\\s\\S]*?body\\.model/);\n});\n\ntest("Apps Script aísla errores por proveedor y respeta el modelo solicitado", async () => {\n    const ai = await fs.readFile("google-apps-script/AI.gs", "utf8");\n    assert.match(ai, /function getAiStatus_\\(validateRemote, provider, model\\)/);\n    assert.match(ai, /try \\{[\\s\\S]*?getAiProviderStatus_/);\n    assert.match(ai, /catch \\(error\\)/);\n    assert.match(ai, /function getAiProviderStatus_\\(provider, validateRemote, model\\)/);\n    assert.match(ai, /normalizeAiModel_\\(providerId, model\\)/);\n});\n\ntest("Configuración verifica sólo el proveedor y modelo activos", async () => {\n    const ui = await fs.readFile("src/ui/AiSettingsController.js", "utf8");\n    assert.match(ui, /provider: this\\.app\\.aiPreferences\\.getProvider\\(\\)/);\n    assert.match(ui, /model: this\\.app\\.aiPreferences\\.getModel\\(\\)/);\n    assert.match(ui, /selectedStatus\\?\\.error/);\n});\n`;

for (const [path, content] of pending) {
    fs.writeFileSync(path, content, "utf8");
}

if (fs.existsSync(testPath)) {
    throw new Error(`${testPath} ya existe; abortando para no sobrescribirlo.`);
}
fs.writeFileSync(testPath, testContent, "utf8");

console.log("OK: estado de proveedores IA aislado por proveedor y modelo.");
