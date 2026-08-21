const INCLUDED_STATUSES = new Set([
    "INBOX",
    "PENDING",
    "COMPLETED"
]);

const PRIORITY_LABELS = Object.freeze({
    0: "Sin prioridad",
    1: "Baja",
    2: "Media",
    3: "Alta",
    4: "Crítica"
});

// Keep the request comfortably below free-tier token limits.
// The server prompt and model answer also consume tokens, so this
// intentionally leaves headroom instead of approaching the limit.
const MAX_TASKS = 70;

function indexById(items = []) {
    return new Map(
        items.map(item => [item.id, item])
    );
}

function nearestProjectTitle(task, tasksById) {
    let current = task;
    const visited = new Set();

    while (current?.parentTaskId) {
        if (visited.has(current.id)) {
            return "";
        }

        visited.add(current.id);
        current = tasksById.get(current.parentTaskId);

        if (current?.isProject) {
            return current.title;
        }
    }

    return "";
}

export function buildAiTaskContext({
    tasks = [],
    areas = [],
    contexts = [],
    tags = [],
    today = new Date().toISOString().slice(0, 10)
} = {}) {
    const areasById = indexById(areas);
    const contextsById = indexById(contexts);
    const tagsById = indexById(tags);
    const tasksById = indexById(tasks);

    const eligible = tasks.filter(
        task => INCLUDED_STATUSES.has(task.status)
    );
    const selected = eligible.slice(0, MAX_TASKS);

    return {
        today,
        taskCount: selected.length,
        omittedCount: Math.max(
            0,
            eligible.length - selected.length
        ),
        tasks: selected.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            isProject: task.isProject === true,
            project:
                nearestProjectTitle(
                    task,
                    tasksById
                ),
            isWaiting: task.isWaiting === true,
            priority: Number(task.priority ?? 0),
            priorityLabel:
                PRIORITY_LABELS[
                    Number(task.priority ?? 0)
                ] || "Sin prioridad",
            area:
                areasById.get(task.areaId)?.name || "",
            context:
                contextsById.get(task.contextId)?.name || "",
            tags: (task.tagIds || [])
                .map(tagId => tagsById.get(tagId)?.name)
                .filter(Boolean),
            startDate: task.startDate || "",
            dueDate: task.dueDate || "",
            dueTime: task.dueTime || "",
            createdAt: task.createdAt || "",
            completedAt: task.completedAt || ""
        }))
    };
}
