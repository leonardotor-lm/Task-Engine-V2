from pathlib import Path
import re


def replace_once(path, pattern, replacement, flags=0):
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f"No se pudo aplicar transformación única en {path}: {pattern}")
    file.write_text(updated, encoding="utf-8")


# 1) El contexto compacto puede transportar identidad sólo cuando el llamador lo pide.
replace_once(
    "src/core/AiTaskContext.js",
    r"(function compactTask\(\n    task,\n    \{\n)(        areasById,)",
    r"\1        includeTaskId = false,\n\2"
)
replace_once(
    "src/core/AiTaskContext.js",
    r"(    const result = \{\n        title: task\.title,\n        status: task\.status\n    \};)",
    r"\1\n\n    if (includeTaskId) result.taskId = String(task.id || \"\");"
)
replace_once(
    "src/core/AiTaskContext.js",
    r"(    question = \"\",\n)(    today = getLocalDateIso\(\))",
    r"\1    includeTaskIds = false,\n\2"
)
replace_once(
    "src/core/AiTaskContext.js",
    r"(            compactTask\(task, \{\n)(                areasById,)",
    r"\1                includeTaskId: includeTaskIds,\n\2"
)

# 2) Todos los flujos estructurados piden identidad explícita.
controllers = [
    "src/ui/AiPriorityProposalController.js",
    "src/ui/AiDueDateProposalController.js",
    "src/ui/AiWaitingProposalController.js",
    "src/ui/AiOrganizationProposalController.js",
    "src/ui/AiProjectProposalController.js",
    "src/ui/AiTaskQualityController.js",
]
for path in controllers:
    replace_once(
        path,
        r'(            question:\n(?:                .*\n)+?)(        \}\);)',
        r'\1            includeTaskIds: true,\n\2'
    )

# 3) Eliminar asociaciones posicionales; enriquecer siempre por taskId.
replace_once(
    "src/ui/AiPriorityProposalController.js",
    r"        return \{\n            \.\.\.base,\n            requestType: \"priorityProposal\",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: pendingTasks\[index\]\?\.id \|\| \"\",\n                currentPriority: Number\(pendingTasks\[index\]\?\.priority \?\? 0\)\n            \}\)\),",
    "        const pendingById = new Map(\n            pendingTasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: \"priorityProposal\",\n            tasks: base.tasks.map(task => ({\n                ...task,\n                currentPriority: Number(\n                    pendingById.get(String(task.taskId))?.priority ?? 0\n                )\n            })),"
)
replace_once(
    "src/ui/AiDueDateProposalController.js",
    r"        return \{\n            \.\.\.base,\n            requestType: \"dueDateProposal\",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: eligibleTasks\[index\]\?\.id \|\| \"\",\n                currentDueDate:\n                    eligibleTasks\[index\]\?\.dueDate \|\| null,\n                currentStartDate:\n                    eligibleTasks\[index\]\?\.startDate \|\| null\n            \}\)\),",
    "        const eligibleById = new Map(\n            eligibleTasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: \"dueDateProposal\",\n            tasks: base.tasks.map(task => {\n                const source = eligibleById.get(String(task.taskId));\n                return {\n                    ...task,\n                    currentDueDate: source?.dueDate || null,\n                    currentStartDate: source?.startDate || null\n                };\n            }),"
)
replace_once(
    "src/ui/AiWaitingProposalController.js",
    r"            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: eligibleTasks\[index\]\?\.id \|\| \"\",\n                currentIsWaiting: false\n            \}\)\),",
    "            tasks: base.tasks.map(task => ({\n                ...task,\n                currentIsWaiting: false\n            })),"
)
replace_once(
    "src/ui/AiOrganizationProposalController.js",
    r"        return \{\n            \.\.\.base,\n            requestType: \"organizationProposal\",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: tasks\[index\]\?\.id \|\| \"\",\n                currentAreaId: tasks\[index\]\?\.areaId \?\? null,\n                currentContextId: tasks\[index\]\?\.contextId \?\? null,\n                currentTagIds: \[\.\.\.\(tasks\[index\]\?\.tagIds \|\| \[\]\)\]\n            \}\)\),",
    "        const tasksById = new Map(\n            tasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: \"organizationProposal\",\n            tasks: base.tasks.map(task => {\n                const source = tasksById.get(String(task.taskId));\n                return {\n                    ...task,\n                    currentAreaId: source?.areaId ?? null,\n                    currentContextId: source?.contextId ?? null,\n                    currentTagIds: [...(source?.tagIds || [])]\n                };\n            }),"
)
replace_once(
    "src/ui/AiProjectProposalController.js",
    r"        return \{\n            \.\.\.base,\n            requestType: \"projectProposal\",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: eligibleTasks\[index\]\?\.id \|\| \"\",\n                taskVersion:\n                    Number\(eligibleTasks\[index\]\?\.version \?\? 1\)\n            \}\)\),",
    "        const eligibleById = new Map(\n            eligibleTasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: \"projectProposal\",\n            tasks: base.tasks.map(task => ({\n                ...task,\n                taskVersion: Number(\n                    eligibleById.get(String(task.taskId))?.version ?? 1\n                )\n            })),"
)
replace_once(
    "src/ui/AiTaskQualityController.js",
    r"        return \{\n            \.\.\.base,\n            requestType: \"taskQualityAudit\",\n            tasks: base\.tasks\.map\(\(task, index\) => \(\{\n                \.\.\.task,\n                taskId: eligibleTasks\[index\]\?\.id \|\| \"\",\n                areaId: eligibleTasks\[index\]\?\.areaId \?\? null,\n                contextId: eligibleTasks\[index\]\?\.contextId \?\? null,\n                tagIds: \[\n                    \.\.\.\(eligibleTasks\[index\]\?\.tagIds \|\| \[\]\)\n                \],\n                isProject:\n                    eligibleTasks\[index\]\?\.isProject === true,\n                parentTaskId:\n                    eligibleTasks\[index\]\?\.parentTaskId \?\? null\n            \}\)\),",
    "        const eligibleById = new Map(\n            eligibleTasks.map(task => [String(task.id), task])\n        );\n\n        return {\n            ...base,\n            requestType: \"taskQualityAudit\",\n            tasks: base.tasks.map(task => {\n                const source = eligibleById.get(String(task.taskId));\n                return {\n                    ...task,\n                    areaId: source?.areaId ?? null,\n                    contextId: source?.contextId ?? null,\n                    tagIds: [...(source?.tagIds || [])],\n                    isProject: source?.isProject === true,\n                    parentTaskId: source?.parentTaskId ?? null\n                };\n            }),"
)

Path("tests/AiTaskIdentityMapping.test.js").write_text('''import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs/promises";\nimport { buildAiTaskContext } from "../src/core/AiTaskContext.js";\n\ntest("el contexto de IA conserva taskId tras filtrar tareas cuando se solicita", () => {\n    const context = buildAiTaskContext({\n        tasks: [\n            { id: "done", title: "Hecha", status: "COMPLETED" },\n            { id: "pending-a", title: "Pendiente A", status: "PENDING" },\n            { id: "pending-b", title: "Pendiente B", status: "PENDING" }\n        ],\n        question: "tareas pendientes",\n        includeTaskIds: true,\n        today: "2026-08-22"\n    });\n\n    assert.deepEqual(\n        context.tasks.map(task => task.taskId),\n        ["pending-a", "pending-b"]\n    );\n});\n\ntest("el contexto general no expone taskId por defecto", () => {\n    const context = buildAiTaskContext({\n        tasks: [{ id: "a", title: "Tarea", status: "PENDING" }],\n        question: "tareas pendientes",\n        today: "2026-08-22"\n    });\n\n    assert.equal("taskId" in context.tasks[0], false);\n});\n\ntest("los flujos estructurados no reconstruyen IDs por índice", async () => {\n    const files = [\n        "AiPriorityProposalController.js",\n        "AiDueDateProposalController.js",\n        "AiWaitingProposalController.js",\n        "AiOrganizationProposalController.js",\n        "AiProjectProposalController.js",\n        "AiTaskQualityController.js"\n    ];\n\n    for (const file of files) {\n        const source = await fs.readFile(`src/ui/${file}`, "utf8");\n        assert.match(source, /includeTaskIds:\\s*true/);\n        assert.doesNotMatch(source, /base\\.tasks\\.map\\(\\(task, index\\)/);\n        assert.doesNotMatch(source, /taskId:\\s*\\w+Tasks?\\[index\\]/);\n    }\n});\n''', encoding="utf-8")

print("Migración de identidad de tareas aplicada correctamente.")
