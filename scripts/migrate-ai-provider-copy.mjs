import fs from "node:fs";

const replacements = [
    {
        path: "google-apps-script/AI.gs",
        from: '    DEFAULT_PROVIDER: "groq",',
        to: '    DEFAULT_PROVIDER: "gemini",'
    },
    {
        path: "google-apps-script/AI.gs",
        from: '            DEFAULT_MODEL: "gemini-3.5-flash-lite",',
        to: '            DEFAULT_MODEL: "gemini-3.7-flash",'
    },
    {
        path: "src/ui/AiSettingsController.js",
        from: 'import {\n    AI_PROVIDERS\n} from "../infrastructure/AiPreferences.js";',
        to: 'import {\n    AI_PROVIDERS,\n    DEFAULT_AI_PROVIDER\n} from "../infrastructure/AiPreferences.js";'
    },
    {
        path: "src/ui/AiSettingsController.js",
        from: '            this.app?.aiPreferences?.getProvider?.() || "groq";',
        to: '            this.app?.aiPreferences?.getProvider?.() ||\n            DEFAULT_AI_PROVIDER;'
    },
    {
        path: "src/ui/AiDueDateProposalController.js",
        from: 'Gemini propone; Task Engine sólo aplica los cambios que selecciones y confirmes.',
        to: 'La IA propone; Task Engine sólo aplica los cambios que selecciones y confirmes.'
    }
];

const pending = new Map();

for (const { path, from, to } of replacements) {
    const source = pending.has(path)
        ? pending.get(path)
        : fs.readFileSync(path, "utf8");

    if (source.includes(to) && !source.includes(from)) {
        pending.set(path, source);
        continue;
    }

    const count = source.split(from).length - 1;
    if (count !== 1) {
        throw new Error(
            `Se esperaba exactamente una coincidencia en ${path} y se encontraron ${count}.`
        );
    }

    pending.set(path, source.replace(from, to));
}

const testPath = "tests/AiProviderConsistency.test.js";
const testContent = `import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs/promises";\nimport {\n    DEFAULT_AI_PROVIDER,\n    DEFAULT_AI_MODEL\n} from "../src/infrastructure/AiPreferences.js";\n\ntest("frontend y Apps Script comparten proveedor y modelo predeterminados", async () => {\n    const source = await fs.readFile("google-apps-script/AI.gs", "utf8");\n\n    assert.equal(DEFAULT_AI_PROVIDER, "gemini");\n    assert.equal(DEFAULT_AI_MODEL, "gemini-3.7-flash");\n    assert.match(source, /DEFAULT_PROVIDER:\\s*"gemini"/);\n    assert.match(\n        source,\n        /gemini:\\s*\\{[\\s\\S]*?DEFAULT_MODEL:\\s*"gemini-3\\.7-flash"/\n    );\n});\n\ntest("la interfaz no atribuye propuestas genéricas a Gemini", async () => {\n    const files = [\n        "src/ui/AiDueDateProposalController.js",\n        "src/ui/AiOrganizationProposalController.js",\n        "src/ui/AiPriorityProposalController.js",\n        "src/ui/AiProjectProposalController.js",\n        "src/ui/AiTaskQualityController.js",\n        "src/ui/AiWaitingProposalController.js"\n    ];\n\n    for (const file of files) {\n        const source = await fs.readFile(file, "utf8");\n        assert.doesNotMatch(source, /Gemini propone/);\n    }\n});\n\ntest("Configuración usa el proveedor predeterminado centralizado", async () => {\n    const source = await fs.readFile(\n        "src/ui/AiSettingsController.js",\n        "utf8"\n    );\n\n    assert.match(source, /DEFAULT_AI_PROVIDER/);\n    assert.doesNotMatch(\n        source,\n        /getProvider\\?\\.\\(\\) \\|\\| "groq"/\n    );\n});\n`;

for (const [path, content] of pending) {
    fs.writeFileSync(path, content, "utf8");
}

if (!fs.existsSync(testPath)) {
    fs.writeFileSync(testPath, testContent, "utf8");
} else {
    const current = fs.readFileSync(testPath, "utf8");
    if (current !== testContent) {
        throw new Error(`${testPath} ya existe con contenido diferente.`);
    }
}

console.log("OK: proveedor/modelo y textos de IA unificados.");