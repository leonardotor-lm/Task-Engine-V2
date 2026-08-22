from pathlib import Path


def replace_exact(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"ERROR: se esperaba 1 coincidencia para {label}, se encontraron {count}. No se escribió ningún archivo."
        )
    return text.replace(old, new, 1)


updates = {}

# AiTaskContext: identidad opt-in.
path = Path("src/core/AiTaskContext.js")
text = path.read_text(encoding="utf-8")
text = replace_exact(
    text,
    """function compactTask(
    task,
    {
        areasById,""",
    """function compactTask(
    task,
    {
        includeTaskId = false,
        areasById,""",
    "AiTaskContext compactTask includeTaskId"
)
text = replace_exact(
    text,
    """    const result = {
        title: task.title,
        status: task.status
    };

    const project = nearestProjectTitle(task, tasksById);""",
    """    const result = {
        title: task.title,
        status: task.status
    };

    if (includeTaskId) {
        result.taskId = String(task.id || "");
    }

    const project = nearestProjectTitle(task, tasksById);""",
    "AiTaskContext result taskId"
)
text = replace_exact(
    text,
    """    tags = [],
    question = "",
    today = getLocalDateIso()""",
    """    tags = [],
    question = "",
    includeTaskIds = false,
    today = getLocalDateIso()""",
    "AiTaskContext includeTaskIds option"
)
text = replace_exact(
    text,
    """            compactTask(task, {
                areasById,""",
    """            compactTask(task, {
                includeTaskId: includeTaskIds,
                areasById,""",
    "AiTaskContext compactTask invocation"
)
updates[path] = text


def add_include_task_ids(path_name, question_fragment):
    path = Path(path_name)
    text = path.read_text(encoding="utf-8")
    old = question_fragment + "\n        });"
    new = question_fragment + ",\n            includeTaskIds: true\n        });"
    text = replace_exact(text, old, new, f"{path_name} includeTaskIds")
    return path, text


# Priority.
path, text = add_include_task_ids(
    "src/ui/AiPriorityProposalController.js",
    '            question: "Proponer prioridades para tareas pendientes"'
)
text = replace_exact(
    text,
    """        return {
            ...base,
            requestType: "priorityProposal",
            tasks: base.tasks.map((task, index) => ({
                ...task,
                taskId: pendingTasks[index]?.id || "",
                currentPriority: Number(pendingTasks[index]?.priority ?? 0)
            })),""",
    """        const pendingById = new Map(
            pendingTasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "priorityProposal",
            tasks: base.tasks.map(task => ({
                ...task,
                currentPriority: Number(
                    pendingById.get(String(task.taskId))?.priority ?? 0
                )
            })),""",
    "priority mapping"
)
updates[path] = text

# Due dates.
path, text = add_include_task_ids(
    "src/ui/AiDueDateProposalController.js",
    '            question:\n                "Proponer fechas de vencimiento para tareas pendientes"'
)
text = replace_exact(
    text,
    """        return {
            ...base,
            requestType: "dueDateProposal",
            tasks: base.tasks.map((task, index) => ({
                ...task,
                taskId: eligibleTasks[index]?.id || "",
                currentDueDate:
                    eligibleTasks[index]?.dueDate || null,
                currentStartDate:
                    eligibleTasks[index]?.startDate || null
            })),""",
    """        const eligibleById = new Map(
            eligibleTasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "dueDateProposal",
            tasks: base.tasks.map(task => {
                const source = eligibleById.get(String(task.taskId));
                return {
                    ...task,
                    currentDueDate: source?.dueDate || null,
                    currentStartDate: source?.startDate || null
                };
            }),""",
    "due date mapping"
)
updates[path] = text

# Waiting.
path, text = add_include_task_ids(
    "src/ui/AiWaitingProposalController.js",
    '            question:\n                "Detectar tareas pendientes que deberían quedar En espera"'
)
text = replace_exact(
    text,
    """            tasks: base.tasks.map((task, index) => ({
                ...task,
                taskId: eligibleTasks[index]?.id || "",
                currentIsWaiting: false
            })),""",
    """            tasks: base.tasks.map(task => ({
                ...task,
                currentIsWaiting: false
            })),""",
    "waiting mapping"
)
updates[path] = text

# Organization.
path, text = add_include_task_ids(
    "src/ui/AiOrganizationProposalController.js",
    '            question:\n                "Proponer organización por área, contexto y etiquetas para tareas pendientes"'
)
text = replace_exact(
    text,
    """        return {
            ...base,
            requestType: "organizationProposal",
            tasks: base.tasks.map((task, index) => ({
                ...task,
                taskId: tasks[index]?.id || "",
                currentAreaId: tasks[index]?.areaId ?? null,
                currentContextId: tasks[index]?.contextId ?? null,
                currentTagIds: [...(tasks[index]?.tagIds || [])]
            })),""",
    """        const tasksById = new Map(
            tasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "organizationProposal",
            tasks: base.tasks.map(task => {
                const source = tasksById.get(String(task.taskId));
                return {
                    ...task,
                    currentAreaId: source?.areaId ?? null,
                    currentContextId: source?.contextId ?? null,
                    currentTagIds: [...(source?.tagIds || [])]
                };
            }),""",
    "organization mapping"
)
updates[path] = text

# Projects.
path, text = add_include_task_ids(
    "src/ui/AiProjectProposalController.js",
    '            question:\n                "Analizar complejidad de tareas pendientes"'
)
text = replace_exact(
    text,
    """        return {
            ...base,
            requestType: "projectProposal",
            tasks: base.tasks.map((task, index) => ({
                ...task,
                taskId: eligibleTasks[index]?.id || "",
                taskVersion:
                    Number(eligibleTasks[index]?.version ?? 1)
            })),""",
    """        const eligibleById = new Map(
            eligibleTasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "projectProposal",
            tasks: base.tasks.map(task => ({
                ...task,
                taskVersion: Number(
                    eligibleById.get(String(task.taskId))?.version ?? 1
                )
            })),""",
    "project mapping"
)
updates[path] = text

# Task quality.
path, text = add_include_task_ids(
    "src/ui/AiTaskQualityController.js",
    '            question:\n                "Auditar calidad y organización de tareas activas"'
)
text = replace_exact(
    text,
    """        return {
            ...base,
            requestType: "taskQualityAudit",
            tasks: base.tasks.map((task, index) => ({
                ...task,
                taskId: eligibleTasks[index]?.id || "",
                areaId: eligibleTasks[index]?.areaId ?? null,
                contextId: eligibleTasks[index]?.contextId ?? null,
                tagIds: [
                    ...(eligibleTasks[index]?.tagIds || [])
                ],
                isProject:
                    eligibleTasks[index]?.isProject === true,
                parentTaskId:
                    eligibleTasks[index]?.parentTaskId ?? null
            })),""",
    """        const eligibleById = new Map(
            eligibleTasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "taskQualityAudit",
            tasks: base.tasks.map(task => {
                const source = eligibleById.get(String(task.taskId));
                return {
                    ...task,
                    areaId: source?.areaId ?? null,
                    contextId: source?.contextId ?? null,
                    tagIds: [...(source?.tagIds || [])],
                    isProject: source?.isProject === true,
                    parentTaskId: source?.parentTaskId ?? null
                };
            }),""",
    "task quality mapping"
)
updates[path] = text

# Sólo después de validar todas las transformaciones escribimos.
for file, content in updates.items():
    file.write_text(content, encoding="utf-8")

Path("tests/AiTaskIdentityMapping.test.js").write_text(
    '''import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs/promises";\nimport { buildAiTaskContext } from "../src/core/AiTaskContext.js";\n\ntest("el contexto de IA conserva taskId tras filtrar tareas cuando se solicita", () => {\n    const context = buildAiTaskContext({\n        tasks: [\n            { id: "done", title: "Hecha", status: "COMPLETED" },\n            { id: "pending-a", title: "Pendiente A", status: "PENDING" },\n            { id: "pending-b", title: "Pendiente B", status: "PENDING" }\n        ],\n        question: "tareas pendientes",\n        includeTaskIds: true,\n        today: "2026-08-22"\n    });\n\n    assert.deepEqual(\n        context.tasks.map(task => task.taskId),\n        ["pending-a", "pending-b"]\n    );\n});\n\ntest("el contexto general no expone taskId por defecto", () => {\n    const context = buildAiTaskContext({\n        tasks: [{ id: "a", title: "Tarea", status: "PENDING" }],\n        question: "tareas pendientes",\n        today: "2026-08-22"\n    });\n\n    assert.equal("taskId" in context.tasks[0], false);\n});\n\ntest("los flujos estructurados no reconstruyen IDs por índice", async () => {\n    const files = [\n        "AiPriorityProposalController.js",\n        "AiDueDateProposalController.js",\n        "AiWaitingProposalController.js",\n        "AiOrganizationProposalController.js",\n        "AiProjectProposalController.js",\n        "AiTaskQualityController.js"\n    ];\n\n    for (const file of files) {\n        const source = await fs.readFile(`src/ui/${file}`, "utf8");\n        assert.match(source, /includeTaskIds:\\s*true/);\n        assert.doesNotMatch(source, /base\\.tasks\\.map\\(\\(task, index\\)/);\n        assert.doesNotMatch(source, /taskId:\\s*\\w+Tasks?\\[index\\]/);\n    }\n});\n''',
    encoding="utf-8"
)

print("OK: migración de identidad aplicada a 7 archivos y prueba de regresión creada.")
