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
        throw new Error(`Se esperaba exactamente una coincidencia en ${path} y se encontraron ${count}.`);
    }
    write(path, source.replace(from, to));
}

const helperPath = "src/core/AiStructuredResponse.js";
if (fs.existsSync(helperPath)) {
    throw new Error(`${helperPath} ya existe; abortando para no sobrescribirlo.`);
}

const helperContent = `function invalidStructuredResponse(kind) {
    return new Error(
        \`La IA devolvió ${"${kind}"} con formato inválido. Intentá nuevamente.\`
    );
}

export function parseAiStructuredCollection(
    answer,
    collectionKey,
    { kind = "una propuesta" } = {}
) {
    const text = String(answer || "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace < firstBrace) {
        throw invalidStructuredResponse(kind);
    }

    let parsed;
    try {
        parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
        throw invalidStructuredResponse(kind);
    }

    if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        !Array.isArray(parsed[collectionKey])
    ) {
        throw invalidStructuredResponse(kind);
    }

    return parsed[collectionKey];
}

export function assertAiStructuredResponseComplete(
    response,
    { kind = "La propuesta" } = {}
) {
    if (response?.truncated === true) {
        throw new Error(
            \`${"${kind}