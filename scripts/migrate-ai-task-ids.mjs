import fs from "node:fs";

function replaceOnce(path, pattern, replacement) {
    const text = fs.readFileSync(path, "utf8");
    const matches = [...text.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"))];
    if (matches.length !== 1) {
        throw new Error(`Se esperó una coincidencia en ${path} y se encontraron ${matches.length}`);
    }
    return text.replace(pattern, replacement);
}

const pendingWrites = new Map();
function read(path) {
    return pendingWrites.has(path)
        ? pendingWrites.get(path)
        : fs.readFileSync(path, "utf8");
}
function queueReplace(path, pattern, replacement) {
    const text = read(path);
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    const matches = [...text.matchAll(re)];
    if (matches.length !== 1) {
        throw new Error(`Se esperó una coincidencia en ${path} y se encontraron ${matches.length}`);
    }
    pendingWrites.set(path, text.replace(pattern, replacement));
}

queueReplace(
    "src/core/AiTaskContext.js",
    /(function compactTask\(\n    task,\n    \{\n)(        areasById,)/,
    "$1        includeTaskId = false,\n$2"
);
queueReplace(
    "src/core/AiTaskContext.js",
    /(    const result = \{\n        title: task\.title,\n        status: task\.status\n    \};)/,
    '$1\n\n    if (includeTaskId) result.taskId = String(task.id || "");'
);
queueReplace(
    "src/core/AiTaskContext.js",
    /(    question = "",\n)(    today = getLocalDateIso\(\))/,
    "$1    includeTaskIds = false,\n$2"
);
queueReplace(
    "src/core/AiTaskContext.js",
    /(            compactTask\(task, \{\n)(                areasById,)/,
    "$1                includeTaskId: includeTaskIds,\n$2"
);

const controllers = [
    "src/ui/AiPriorityProposalController.js",
    "src/ui/AiDueDateProposalController.js",
    "src/ui/AiWaitingProposalController.js",
    "src/ui/AiOrganizationProposalController.js",
    "src/ui/AiProjectProposalController.js",
    "src/ui/AiTaskQualityController.js"
];

for (const path of controllers) {
    queueReplace(
        path,
        /(            question:\n(?:                .*\n)+?)(        \}\);)/,
        "$1            includeTaskIds: true,\n$2"
    );
}

queueReplace(
    "src/ui/AiPriorityProposalController.js",
    /        return \{\n            \.\.\.base,\n            requestType: "priorityProposal",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: pendingTasks\[index\]\?\.id \|\| "",\n                currentPriority: Number\(pendingTasks\[index\]\?\.priority \?\? 0\)\n            \}\)\),/,
    `        const pendingById = new Map(\n            pendingTasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: "priorityProposal",\n            tasks: base.tasks.map(task => ({\n                ...task,\n                currentPriority: Number(\n                    pendingById.get(String(task.taskId))?.priority ?? 0\n                )\n            })),`
);

queueReplace(
    "src/ui/AiDueDateProposalController.js",
    /        return \{\n            \.\.\.base,\n            requestType: "dueDateProposal",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: eligibleTasks\[index\]\?\.id \|\| "",\n                currentDueDate:\n                    eligibleTasks\[index\]\?\.dueDate \|\| null,\n                currentStartDate:\n                    eligibleTasks\[index\]\?\.startDate \|\| null\n            \}\)\),/,
    `        const eligibleById = new Map(\n            eligibleTasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: "dueDateProposal",\n            tasks: base.tasks.map(task => {\n                const source = eligibleById.get(String(task.taskId));\n                return {\n                    ...task,\n                    currentDueDate: source?.dueDate || null,\n                    currentStartDate: source?.startDate || null\n                };\n            }),`
);

queueReplace(
    "src/ui/AiWaitingProposalController.js",
    /            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: eligibleTasks\[index\]\?\.id \|\| "",\n                currentIsWaiting: false\n            \}\)\),/,
    `            tasks: base.tasks.map(task => ({\n                ...task,\n                currentIsWaiting: false\n            })),`
);

queueReplace(
    "src/ui/AiOrganizationProposalController.js",
    /        return \{\n            \.\.\.base,\n            requestType: "organizationProposal",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: tasks\[index\]\?\.id \|\| "",\n                currentAreaId: tasks\[index\]\?\.areaId \?\? null,\n                currentContextId: tasks\[index\]\?\.contextId \?\? null,\n                currentTagIds: \[\.\.\.\(tasks\[index\]\?\.tagIds \|\| \[\]\)\]\n            \}\)\),/,
    `        const tasksById = new Map(\n            tasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: "organizationProposal",\n            tasks: base.tasks.map(task => {\n                const source = tasksById.get(String(task.taskId));\n                return {\n                    ...task,\n                    currentAreaId: source?.areaId ?? null,\n                    currentContextId: source?.contextId ?? null,\n                    currentTagIds: [...(source?.tagIds || [])]\n                };\n            }),`
);

queueReplace(
    "src/ui/AiProjectProposalController.js",
    /        return \{\n            \.\.\.base,\n            requestType: "projectProposal",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: eligibleTasks\[index\]\?\.id \|\| "",\n                taskVersion:\n                    Number\(eligibleTasks\[index\]\?\.version \?\? 1\)\n            \}\)\),/,
    `        const eligibleById = new Map(\n            eligibleTasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: "projectProposal",\n            tasks: base.tasks.map(task => ({\n                ...task,\n                taskVersion: Number(\n                    eligibleById.get(String(task.taskId))?.version ?? 1\n                )\n            })),`
);

queueReplace(
    "src/ui/AiTaskQualityController.js",
    /        return \{\n            \.\.\.base,\n            requestType: "taskQualityAudit",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: eligibleTasks\[index\]\?\.id \|\| "",\n                areaId: eligibleTasks\[index\]\?\.areaId \?\? null,\n                contextId: eligibleTasks\[index\]\?\.contextId \?\? null,\n                tagIds: \[\n                    \.\.\.\(eligibleTasks\[index\]\?\.tagIds \|\| \[\]\)\n                \],\n                isProject:\n                    eligibleTasks\[index\]\?\.isProject === true,\n                parentTaskId:\n                    eligibleTasks\[index\]\?\.parentTaskId \?\? null\n            \}\)\),/,
    `        const eligibleById = new Map(\n            eligibleTasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: "taskQualityAudit",\n            tasks: base.tasks.map(task => {\n                const source = eligibleById.get(String(task.taskId));\n                return {\n                    ...task,\n                    areaId: source?.areaId ?? null,\n                    contextId: source?.contextId ?? null,\n                    tagIds: [...(source?.tagIds || [])],\n                    isProject: source?.isProject === true,\n                    parentTaskId: source?.parentTaskId ?? null\n                };\n            }),`
);

const testPath = "tests/AiTaskIdentityMapping.test.js";
if (fs.existsSync(testPath)) {
    throw new Error(`${testPath} ya existe; abortando para no sobrescribirlo.`);
}

const testContent = `import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs/promises";\nimport { buildAiTaskContext } from "../src/core/AiTaskContext.js";\n\ntest("el contexto de IA conserva taskId tras filtrar tareas cuando se solicita", () => {\n    const context = buildAiTaskContext({\n        tasks: [\n            { id: "done", title: "Hecha", status: "COMPLETED" },\n            { id: "pending-a", title: "Pendiente A", status: "PENDING" },\n            { id: "pending-b", title: "Pendiente B", status: "PENDING" }\n        ],\n        question: "tareas pendientes",\n        includeTaskIds: true,\n        today: "2026-08-22"\n    });\n\n    assert.deepEqual(\n        context.tasks.map(task => task.taskId),\n        ["pending-a", "pending-b"]\n    );\n});\n\ntest("el contexto general no expone taskId por defecto", () => {\n    const context = buildAiTaskContext({\n        tasks: [{ id: "a", title: "Tarea", status: "PENDING" }],\n        question: "tareas pendientes",\n        today: "2026-08-22"\n    });\n\n    assert.equal("taskId" in context.tasks[0], false);\n});\n\ntest("los flujos estructurados no reconstruyen IDs por índice", async () => {\n    const files = [\n        "AiPriorityProposalController.js",\n        "AiDueDateProposalController.js",\n        "AiWaitingProposalController.js",\n        "AiOrganizationProposalController.js",\n        "AiProjectProposalController.js",\n        "AiTaskQualityController.js"\n    ];\n\n    for (const file of files) {\n        const source = await fs.readFile(\`src/ui/\${file}\`, "utf8");\n        assert.match(source, /includeTaskIds:\\s*true/);\n        assert.doesNotMatch(source, /base\\.tasks\\.map\\(\\(task, index\\)/);\n        assert.doesNotMatch(source, /taskId:\\s*\\w+Tasks?\\[index\\]/);\n    }\n});\n`;

for (const [path, content] of pendingWrites) {
    fs.writeFileSync(path, content, "utf8");
}
fs.writeFileSync(testPath, testContent, "utf8");

console.log("OK: migración de identidad aplicada a 7 archivos y prueba de regresión creada.");
