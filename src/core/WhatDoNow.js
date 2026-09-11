import {
    buildTaskReviewSignals
} from "./TaskReviewSignals.js";

const PRIORITY_LABELS = Object.freeze({
    1: "Prioridad baja",
    2: "Prioridad media",
    3: "Prioridad alta",
    4: "Prioridad crítica"
});

function dateOnly(value) {
    return String(value || "").slice(0, 10);
}

function daysBetween(start, end) {
    const startDate = dateOnly(start);
    const endDate = dateOnly(end);
    if (!startDate || !endDate) return null;

    const startMs = Date.parse(`${startDate}T00:00:00Z`);
    const endMs = Date.parse(`${endDate}T00:00:00Z`);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;

    return Math.round((endMs - startMs) / 86400000);
}

function indexById(items = []) {
    return new Map(items.map(item => [item.id, item]));
}

function nearestProject(task, tasksById) {
    let current = task;
    const visited = new Set();

    while (current?.parentTaskId) {
        if (visited.has(current.id)) break;
        visited.add(current.id);
        current = tasksById.get(current.parentTaskId);
        if (current?.isProject) return current;
    }

    return null;
}

function dueReason(task, today) {
    if (!task.dueDate) return null;
    const days = daysBetween(today, task.dueDate);
    if (days === null) return null;
    if (days < 0) {
        const overdue = Math.abs(days);
        return overdue === 1
            ? "Venció ayer"
            : `Está vencida hace ${overdue} días`;
    }
    if (days === 0) return "Vence hoy";
    if (days === 1) return "Vence mañana";
    if (days <= 7) return `Vence en ${days} días`;
    return null;
}

function scoreTask(task, signals, today) {
    let score = 10;
    const reasons = [];
    const due = dueReason(task, today);
    const daysUntilDue = task.dueDate
        ? daysBetween(today, task.dueDate)
        : null;

    if (daysUntilDue !== null) {
        if (daysUntilDue < 0) {
            score += 120 + Math.min(Math.abs(daysUntilDue), 30) * 2;
        } else if (daysUntilDue === 0) {
            score += 110;
        } else if (daysUntilDue === 1) {
            score += 85;
        } else if (daysUntilDue <= 7) {
            score += 70 - daysUntilDue * 4;
        }
    }

    if (due) reasons.push(due);

    const priority = Number(task.priority || 0);
    if (priority > 0) {
        score += priority * 12;
        reasons.push(PRIORITY_LABELS[priority] || `Prioridad ${priority}`);
    }

    const repeated = signals.find(
        signal => signal.type === "REPEATED_POSTPONEMENTS"
    );
    if (repeated) {
        score += 25;
        reasons.push(repeated.label);
    }

    const stale = signals.find(
        signal => signal.type === "STALE_UNSCHEDULED"
    );
    if (stale) {
        score += 20;
        reasons.push(stale.label);
    }

    if (task.startDate) {
        const startDelta = daysBetween(today, task.startDate);
        if (startDelta === 0) {
            score += 15;
            reasons.push("Empieza hoy");
        } else if (startDelta !== null && startDelta < 0) {
            score += 5;
        }
    }

    return {
        score,
        reasons: [...new Set(reasons)].slice(0, 3)
    };
}

export function buildWhatDoNowRecommendations({
    tasks = [],
    areas = [],
    contexts = [],
    tags = [],
    goals = [],
    today,
    limit = 5,
    ruleConfig = {}
} = {}) {
    const tasksById = indexById(tasks);
    const areasById = indexById(areas);
    const contextsById = indexById(contexts);
    const tagsById = indexById(tags);
    const goalsById = indexById(goals);
    const signals = buildTaskReviewSignals({
        tasks,
        today,
        config: ruleConfig
    });
    const signalsByTask = new Map();

    for (const signal of signals) {
        const current = signalsByTask.get(signal.taskId) || [];
        current.push(signal);
        signalsByTask.set(signal.taskId, current);
    }

    return tasks
        .filter(task => task?.status === "PENDING")
        .filter(task => task.isWaiting !== true)
        .filter(task => task.isProject !== true)
        .filter(task => !task.startDate || dateOnly(task.startDate) <= today)
        .map(task => {
            const taskSignals = signalsByTask.get(task.id) || [];
            const ranking = scoreTask(task, taskSignals, today);
            const project = nearestProject(task, tasksById);
            const taskTags = (task.tagIds || [])
                .map(id => tagsById.get(id)?.name)
                .filter(Boolean);
            const taskGoals = (task.goalIds || [])
                .map(id => goalsById.get(id)?.name || goalsById.get(id)?.title)
                .filter(Boolean);

            return {
                taskId: task.id,
                title: task.title,
                score: ranking.score,
                reasons: ranking.reasons.length
                    ? ranking.reasons
                    : ["Está disponible para avanzar ahora"],
                data: {
                    priority: Number(task.priority || 0),
                    dueDate: dateOnly(task.dueDate) || null,
                    dueTime: task.dueTime || null,
                    startDate: dateOnly(task.startDate) || null,
                    area: areasById.get(task.areaId)?.name || null,
                    context: contextsById.get(task.contextId)?.name || null,
                    tags: taskTags,
                    project: project?.title || null,
                    goals: taskGoals,
                    postponements: Array.isArray(task.postponements)
                        ? task.postponements.length
                        : 0,
                    recurring: Boolean(task.recurrence)
                },
                signals: taskSignals
            };
        })
        .sort((first, second) => {
            if (second.score !== first.score) {
                return second.score - first.score;
            }

            const firstDue = first.data.dueDate || "9999-12-31";
            const secondDue = second.data.dueDate || "9999-12-31";
            if (firstDue !== secondDue) {
                return firstDue.localeCompare(secondDue);
            }

            if (second.data.priority !== first.data.priority) {
                return second.data.priority - first.data.priority;
            }

            return first.title.localeCompare(second.title, "es");
        })
        .slice(0, Math.max(1, Math.min(Number(limit) || 5, 5)));
}
