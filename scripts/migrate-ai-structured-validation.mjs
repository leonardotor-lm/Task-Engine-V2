import fs from "node:fs";

const pending = new Map();

function read(path) {
    if (pending.has(path)) return pending.get(path);
    return fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

function write(path, content) {
    pending.set(path, content);
}

function replaceOnce(path, from, to) {
    const source = read(path);
    const count = source.split(from).length - 1;
    if (count !== 1) {
        throw new Error(
            `Se esperaba exactamente una coincidencia en ${path} y se encontraron ${count}.`
        );
    }
    write(path, source.replace(from, to));
}

function replaceRegexOnce(path, pattern, replacer) {
    const source = read(path);
    const matches = [...source.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"))];
    if (matches.length !== 1) {
        throw new Error(
            `Se esperaba exactamente una coincidencia estructural en ${path} y se encontraron ${matches.length}.`
        );
    }
    write(path, source.replace(pattern, replacer));
}

const helperPath = "src/core/AiStructuredResponse.js";
if (fs.existsSync(helperPath)) {
    throw new Error(`${helperPath} ya existe; abortando para no sobrescribirlo.`);
}

const helperContent = [
    "function invalidStructuredResponse(kind) {",
    "    return new Error(",
    "        \"La IA devolvió \" + kind +",
    "        \" con formato inválido. Intentá nuevamente.\"",
    "    );",
    "}",
    "",
    "export function requireAiStructuredCollection(",
    "    parsed,",
    "    collectionKey,",
    "    { kind = \"una propuesta\" } = {}",
    ") {",
    "    if (",
    "        !parsed ||",
    "        typeof parsed !== \"object\" ||",
    "        Array.isArray(parsed) ||",
    "        !Array.isArray(parsed[collectionKey])",
    "    ) {",
    "        throw invalidStructuredResponse(kind);",
    "    }",
    "",
    "    return parsed[collectionKey];",
    "}",
    "",
    "export function assertAiStructuredResponseComplete(",
    "    response,",
    "    { kind = \"La propuesta\" } = {}",
    ") {",
    "    if (response?.truncated === true) {",
    "        throw new Error(",
    "            kind + \" quedó incompleta. Intentá nuevamente.\"",
    "        );",
    "    }",
    "}",
    ""
].join("\n");

const controllerConfigs = [
    {
        path: "src/ui/AiDueDateProposalController.js",
        collection: "proposals",
        kind: "una propuesta",
        completeKind: "La propuesta de fechas",
        oldCollection: [
            "    const proposals = Array.isArray(parsed?.proposals)",
            "        ? parsed.proposals",
            "        : [];"
        ].join("\n"),
        newCollection: [
            "    const proposals = requireAiStructuredCollection(",
            "        parsed,",
            "        \"proposals\",",
            "        { kind: \"una propuesta\" }",
            "    );"
        ].join("\n")
    },
    {
        path: "src/ui/AiWaitingProposalController.js",
        collection: "proposals",
        kind: "una propuesta",
        completeKind: "La propuesta de tareas En espera",
        oldCollection: [
            "    const proposals = Array.isArray(parsed?.proposals)",
            "        ? parsed.proposals",
            "        : [];"
        ].join("\n"),
        newCollection: [
            "    const proposals = requireAiStructuredCollection(",
            "        parsed,",
            "        \"proposals\",",
            "        { kind: \"una propuesta\" }",
            "    );"
        ].join("\n")
    },
    {
        path: "src/ui/AiOrganizationProposalController.js",
        collection: "proposals",
        kind: "una propuesta",
        completeKind: "La propuesta de organización",
        oldCollection: [
            "    const proposals = Array.isArray(parsed?.proposals)",
            "        ? parsed.proposals",
            "        : [];"
        ].join("\n"),
        newCollection: [
            "    const proposals = requireAiStructuredCollection(",
            "        parsed,",
            "        \"proposals\",",
            "        { kind: \"una propuesta\" }",
            "    );"
        ].join("\n")
    },
    {
        path: "src/ui/AiProjectProposalController.js",
        collection: "proposals",
        kind: "una propuesta",
        completeKind: "La propuesta de proyectos",
        oldCollection: [
            "    const proposals = Array.isArray(parsed?.proposals)",
            "        ? parsed.proposals",
            "        : [];"
        ].join("\n"),
        newCollection: [
            "    const proposals = requireAiStructuredCollection(",
            "        parsed,",
            "        \"proposals\",",
            "        { kind: \"una propuesta\" }",
            "    );"
        ].join("\n")
    },
    {
        path: "src/ui/AiTaskQualityController.js",
        collection: "findings",
        kind: "un diagnóstico",
        completeKind: "El diagnóstico de calidad",
        oldCollection: [
            "    const findings = Array.isArray(parsed?.findings)",
            "        ? parsed.findings",
            "        : [];"
        ].join("\n"),
        newCollection: [
            "    const findings = requireAiStructuredCollection(",
            "        parsed,",
            "        \"findings\",",
            "        { kind: \"un diagnóstico\" }",
            "    );"
        ].join("\n")
    }
];

for (const config of controllerConfigs) {
    replaceOnce(
        config.path,
        'import { escapeHtml } from "./escapeHtml.js";',
        [
            'import { escapeHtml } from "./escapeHtml.js";',
            'import {',
            '    assertAiStructuredResponseComplete,',
            '    requireAiStructuredCollection',
            '} from "../core/AiStructuredResponse.js";'
        ].join("\n")
    );

    replaceOnce(
        config.path,
        config.oldCollection,
        config.newCollection
    );

    replaceRegexOnce(
        config.path,
        /(            const response = await gateway\.aiQuery\(\{[\s\S]*?            \}\);\n)/,
        match => match + [
            "            assertAiStructuredResponseComplete(",
            "                response,",
            `                { kind: ${JSON.stringify(config.completeKind)} }`,
            "            );",
            ""
        ].join("\n")
    );
}

replaceOnce(
    "google-apps-script/AI.gs",
    [
        "    var proposals = Array.isArray(parsed.proposals)",
        "        ? parsed.proposals",
        "        : [];"
    ].join("\n"),
    [
        "    if (!Array.isArray(parsed.proposals)) {",
        "        throw protocolError_(",
        "            \"AI_INVALID_PROPOSAL\",",
        "            \"La IA devolvió una propuesta con formato inválido. Intentá nuevamente.\"",
        "        );",
        "    }",
        "",
        "    var proposals = parsed.proposals;"
    ].join("\n")
);

const testPath = "tests/AiStructuredResponse.test.js";
if (fs.existsSync(testPath)) {
    throw new Error(`${testPath} ya existe; abortando para no sobrescribirlo.`);
}

const testContent = [
    'import test from "node:test";',
    'import assert from "node:assert/strict";',
    'import fs from "node:fs/promises";',
    'import {',
    '    assertAiStructuredResponseComplete,',
    '    requireAiStructuredCollection',
    '} from "../src/core/AiStructuredResponse.js";',
    '',
    'test("requireAiStructuredCollection acepta una colección vacía válida", () => {',
    '    assert.deepEqual(',
    '        requireAiStructuredCollection({ proposals: [] }, "proposals"),',
    '        []',
    '    );',
    '});',
    '',
    'test("requireAiStructuredCollection rechaza colección ausente o de tipo incorrecto", () => {',
    '    assert.throws(() => requireAiStructuredCollection({}, "proposals"), /formato inválido/);',
    '    assert.throws(() => requireAiStructuredCollection({ proposals: {} }, "proposals"), /formato inválido/);',
    '});',
    '',
    'test("assertAiStructuredResponseComplete rechaza respuestas truncadas", () => {',
    '    assert.throws(',
    '        () => assertAiStructuredResponseComplete({ truncated: true }),',
    '        /incompleta/',
    '    );',
    '    assert.doesNotThrow(() => assertAiStructuredResponseComplete({ truncated: false }));',
    '});',
    '',
    'test("los flujos estructurados usan la validación común", async () => {',
    '    const files = [',
    '        "src/ui/AiDueDateProposalController.js",',
    '        "src/ui/AiWaitingProposalController.js",',
    '        "src/ui/AiOrganizationProposalController.js",',
    '        "src/ui/AiProjectProposalController.js",',
    '        "src/ui/AiTaskQualityController.js"',
    '    ];',
    '    for (const path of files) {',
    '        const source = await fs.readFile(path, "utf8");',
    '        assert.match(source, /requireAiStructuredCollection/);',
    '        assert.match(source, /assertAiStructuredResponseComplete/);',
    '    }',
    '});',
    '',
    'test("prioridades rechaza proposals que no sea un array", async () => {',
    '    const source = await fs.readFile("google-apps-script/AI.gs", "utf8");',
    '    assert.match(source, /if \(!Array\.isArray\(parsed\.proposals\)\)/);',
    '    assert.doesNotMatch(source, /Array\.isArray\(parsed\.proposals\)[\\s\\S]{0,80}: \[\]/);',
    '});',
    ''
].join("\n");

for (const [path, content] of pending) {
    fs.writeFileSync(path, content, "utf8");
}
fs.writeFileSync(helperPath, helperContent, "utf8");
fs.writeFileSync(testPath, testContent, "utf8");

console.log("OK: validación estructurada de IA unificada.");
