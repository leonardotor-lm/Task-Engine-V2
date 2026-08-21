const INCLUDED_STATUSES = new Set([
    "INBOX",
    "PENDING",
    "COMPLETED"
]);

const ACTIVE_STATUSES = new Set([
    "INBOX",
    "PENDING"
]);

const PRIORITY_LABELS = Object.freeze({
    0: "Sin prioridad",
    1: "Baja",
    2: "Media",
    3: "Alta",
    4: "Crítica"
});

function indexById(items = []) {
    return new Map(
        items.map(item => [item.id, item])
    );
}

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function dateOnly(value) {
    return String(value || "").slice(0, 10);
}

function addDays(date, amount) {
    const parsed = new Date(`${date}T00:00:00Z`);
    parsed.setUTCDate(parsed.getUTCDate() + amount);
    return parsed.toISOString().slice(0, 10);
}

function startOfWeek(date) {
    const parsed = new Date(`${date}T00:00:00Z`);
    const day = parsed.getUTCDay();
    const offset = day === 0 ? -6 : 1 - day;
    return addDays(date, offset);
}

function isWithin(value, start, end) {
    const date = dateOnly(value);
    return Boolean(date) && date >= start && date <= end;
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

function referencedIds(question, items = []) {
    return new Set(
        items
            .filter(item => {
                const name = normalizeText(item?.name);
                return name && question.includes(name);
            })
            .map(item => item.id)
    );
}

function priorityFromQuestion(question) {
    if (/\bcritic/.test(question)) return 4;
    if (/\balta\b|\bimportante/.test(question)) return 3;
    if (/\bmedia\b/.test(question)) return 2;
    if (/\bbaja\b/.test(question)) return 1;
    if (/sin prioridad/.test(question)) return 0;
    return null;
}

function selectTasksForQuestion({
    tasks,
    areas,
    contexts,
    tags,
    today,
    question,
    tasksById
}) {
    const normalized = normalizeText(question);
    const asksAll = /\btodas?\b/.test(normalized);
    const asksCompleted =
        /complet|realiz|termin|finaliz|\bhecho\b|\bhice\b/.test(
            normalized
        );
    const asksInbox =
        /\binbox\b|bandeja de entrada/.test(normalized);
    const asksPending = /\bpendient/.test(normalized);

    let selected = tasks.filter(
        task => INCLUDED_STATUSES.has(task.status)
    );

    if (asksInbox) {
        selected = selected.filter(
            task => task.status === "INBOX"
        );
    } else if (asksCompleted) {
        selected = selected.filter(
            task => task.status === "COMPLETED"
        );
    } else if (asksPending) {
        selected = selected.filter(
            task => task.status === "PENDING"
        );
    } else if (!asksAll) {
        selected = selected.filter(
            task => ACTIVE_STATUSES.has(task.status)
        );
    }

    const areaIds = referencedIds(normalized, areas);
    const contextIds = referencedIds(normalized, contexts);
    const tagIds = referencedIds(normalized, tags);

    if (areaIds.size) {
        selected = selected.filter(
            task => areaIds.has(task.areaId)
        );
    }

    if (contextIds.size) {
        selected = selected.filter(
            task => contextIds.has(task.contextId)
        );
    }

    if (tagIds.size) {
        selected = selected.filter(
            task => (task.tagIds || []).some(
                tagId => tagIds.has(tagId)
            )
        );
    }

    const namedProjects = tasks.filter(task =>
        task.isProject === true &&
        normalizeText(task.title) &&
        normalized.includes(normalizeText(task.title))
    );

    if (namedProjects.length) {
        const projectNames = new Set(
            namedProjects.map(project => project.title)
        );
        selected = selected.filter(task =>
            projectNames.has(task.title) ||
            projectNames.has(
                nearestProjectTitle(task, tasksById)
            )
        );
    } else if (/\bproyectos?\b/.test(normalized)) {
        selected = selected.filter(
            task => task.isProject === true
        );
    }

    if (/\ben espera\b|esperando|bloquead/.test(normalized)) {
        selected = selected.filter(
            task => task.isWaiting === true
        );
    }

    if (
        /sin fecha|sin vencimiento|no tienen fecha|no tenga fecha/.test(
            normalized
        )
    ) {
        selected = selected.filter(
            task => !task.dueDate && !task.startDate
        );
    }

    const priority = priorityFromQuestion(normalized);
    if (priority !== null) {
        selected = selected.filter(
            task => Number(task.priority ?? 0) === priority
        );
    }

    const tomorrow = addDays(today, 1);
    const weekStart = startOfWeek(today);
    const weekEnd = addDays(weekStart, 6);
    const monthPrefix = today.slice(0, 7);
    const asksOverdue = /\bvencid/.test(normalized);
    const asksToday = /\bhoy\b/.test(normalized);
    const asksTomorrow = /\bmanana\b/.test(normalized);
    const asksWeek = /esta semana|semana actual/.test(normalized);
    const asksMonth = /este mes|mes actual/.test(normalized);
    const asksStart = /empiez|inicio|inician|comien/.test(normalized);
    const asksDue = /vence|vencim|vencid/.test(normalized);

    if (asksOverdue) {
        selected = selected.filter(task =>
            ACTIVE_STATUSES.has(task.status) &&
            Boolean(task.dueDate) &&
            dateOnly(task.dueDate) < today
        );
    } else if (asksToday) {
        selected = selected.filter(task => {
            if (asksCompleted) {
                return dateOnly(task.completedAt) === today;
            }
            if (asksStart && !asksDue) {
                return dateOnly(task.startDate) === today;
            }
            return dateOnly(task.dueDate) === today;
        });
    } else if (asksTomorrow) {
        selected = selected.filter(task => {
            if (asksStart && !asksDue) {
                return dateOnly(task.startDate) === tomorrow;
            }
            return dateOnly(task.dueDate) === tomorrow;
        });
    } else if (asksWeek) {
        selected = selected.filter(task => {
            const value = asksCompleted
                ? task.completedAt
                : asksStart && !asksDue
                    ? task.startDate
                    : task.dueDate;
            return isWithin(value, weekStart, weekEnd);
        });
    } else if (asksMonth) {
        selected = selected.filter(task => {
            const value = asksCompleted
                ? task.completedAt
                : asksStart && !asksDue
                    ? task.startDate
                    : task.dueDate;
            return dateOnly(value).startsWith(monthPrefix);
        });
    }

    return selected;
}

function compactTask(
    task,
    {
        areasById,
        contextsById,
        tagsById,
        tasksById,
        question
    }
) {
    const result = {
        title: task.title,
        status: task.status
    };

    const project = nearestProjectTitle(task, tasksById);
    const priority = Number(task.priority ?? 0);
    const area = areasById.get(task.areaId)?.name || "";
    const context = contextsById.get(task.contextId)?.name || "";
    const taskTags = (task.tagIds || [])
        .map(tagId => tagsById.get(tagId)?.name)
        .filter(Boolean);

    if (task.isProject === true) result.isProject = true;
    if (project) result.project = project;
    if (task.isWaiting === true) result.isWaiting = true;
    if (priority > 0 || /prioridad|prioriz/.test(question)) {
        result.priority = PRIORITY_LABELS[priority] || "Sin prioridad";
    }
    if (area) result.area = area;
    if (context) result.context = context;
    if (taskTags.length) result.tags = taskTags;
    if (task.startDate) result.startDate = dateOnly(task.startDate);
    if (task.dueDate) result.dueDate = dateOnly(task.dueDate);
    if (task.dueTime) result.dueTime = task.dueTime;
    if (task.completedAt) {
        result.completedAt = String(task.completedAt);
    }
    if (/cread|creacion|antigu|recient/.test(question) && task.createdAt) {
        result.createdAt = String(task.createdAt);
    }

    return result;
}

export function buildAiTaskContext({
    tasks = [],
    areas = [],
    contexts = [],
    tags = [],
    question = "",
    today = new Date().toISOString().slice(0, 10)
} = {}) {
    const areasById = indexById(areas);
    const contextsById = indexById(contexts);
    const tagsById = indexById(tags);
    const tasksById = indexById(tasks);
    const normalizedQuestion = normalizeText(question);

    const selected = selectTasksForQuestion({
        tasks,
        areas,
        contexts,
        tags,
        today,
        question,
        tasksById
    });

    return {
        today,
        selection: "query-relevant",
        taskCount: selected.length,
        omittedCount: 0,
        tasks: selected.map(task =>
            compactTask(task, {
                areasById,
                contextsById,
                tagsById,
                tasksById,
                question: normalizedQuestion
            })
        )
    };
}
