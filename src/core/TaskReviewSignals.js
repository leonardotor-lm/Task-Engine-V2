const ACTIVE_STATUSES = new Set(["INBOX", "PENDING"]);

export const DEFAULT_TASK_REVIEW_RULES = Object.freeze({
    staleUnscheduled: Object.freeze({
        enabled: true,
        days: 30
    }),
    overdue: Object.freeze({
        enabled: true,
        days: 1
    }),
    repeatedPostponements: Object.freeze({
        enabled: true,
        count: 3
    })
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

    return Math.floor((endMs - startMs) / 86400000);
}

function positiveInteger(value, fallback) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0
        ? parsed
        : fallback;
}

function mergeRuleConfig(config = {}) {
    return {
        staleUnscheduled: {
            ...DEFAULT_TASK_REVIEW_RULES.staleUnscheduled,
            ...(config.staleUnscheduled || {})
        },
        overdue: {
            ...DEFAULT_TASK_REVIEW_RULES.overdue,
            ...(config.overdue || {})
        },
        repeatedPostponements: {
            ...DEFAULT_TASK_REVIEW_RULES.repeatedPostponements,
            ...(config.repeatedPostponements || {})
        }
    };
}

export function buildTaskReviewSignals({
    tasks = [],
    today,
    config = {}
} = {}) {
    const rules = mergeRuleConfig(config);
    const signals = [];

    for (const task of tasks) {
        if (!ACTIVE_STATUSES.has(task?.status)) continue;

        if (rules.overdue.enabled && task.dueDate) {
            const daysOverdue = daysBetween(task.dueDate, today);
            const threshold = positiveInteger(rules.overdue.days, 1);

            if (daysOverdue !== null && daysOverdue >= threshold) {
                signals.push({
                    taskId: task.id,
                    type: "OVERDUE",
                    value: daysOverdue,
                    threshold,
                    label: daysOverdue === 1
                        ? "Vencida hace 1 día"
                        : `Vencida hace ${daysOverdue} días`
                });
            }
        }

        if (
            rules.staleUnscheduled.enabled &&
            task.status === "PENDING" &&
            !task.startDate &&
            !task.dueDate
        ) {
            const referenceDate = task.updatedAt || task.createdAt;
            const inactiveDays = daysBetween(referenceDate, today);
            const threshold = positiveInteger(
                rules.staleUnscheduled.days,
                30
            );

            if (inactiveDays !== null && inactiveDays >= threshold) {
                signals.push({
                    taskId: task.id,
                    type: "STALE_UNSCHEDULED",
                    value: inactiveDays,
                    threshold,
                    label: `Sin fecha y sin cambios hace ${inactiveDays} días`
                });
            }
        }

        if (rules.repeatedPostponements.enabled) {
            const postponementCount = Array.isArray(task.postponements)
                ? task.postponements.length
                : 0;
            const threshold = positiveInteger(
                rules.repeatedPostponements.count,
                3
            );

            if (postponementCount >= threshold) {
                signals.push({
                    taskId: task.id,
                    type: "REPEATED_POSTPONEMENTS",
                    value: postponementCount,
                    threshold,
                    label: `Pospuesta ${postponementCount} veces`
                });
            }
        }
    }

    return signals;
}
