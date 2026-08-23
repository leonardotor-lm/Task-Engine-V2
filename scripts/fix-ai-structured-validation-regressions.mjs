import fs from "node:fs";

function read(path) {
    return fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

function replaceOnce(path, from, to) {
    const source = read(path);
    const count = source.split(from).length - 1;
    if (count !== 1) {
        throw new Error(`Se esperaba exactamente una coincidencia en ${path} y se encontraron ${count}.`);
    }
    fs.writeFileSync(path, source.replace(from, to), "utf8");
}

replaceOnce(
    "pwa-assets.js",
    '    "./src/core/AiTaskContext.js",\n    "./src/core/AtomicTaskUpdates.js",',
    '    "./src/core/AiTaskContext.js",\n    "./src/core/AiStructuredResponse.js",\n    "./src/core/AtomicTaskUpdates.js",'
);

replaceOnce(
    "tests/AiStructuredResponse.test.js",
    "/if (!Array.isArray(parsed.proposals))/",
    "/if\\s*\\(\\s*!Array\\.isArray\\(parsed\\.proposals\\)\\s*\\)/"
);

console.log("OK: regresiones de validación estructurada corregidas.");
