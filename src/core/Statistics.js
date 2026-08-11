import { TaskStatus } from "../domain/TaskStatus.js";
import { GoalStatus } from "../domain/GoalStatus.js";

const PERIODS = Object.freeze({
    "7": 7,
    "30": 30,
    "90": 90,
    "180": 180,
    "365": 365,
    ALL: null
});

function isIncludedTask(task) {
    return ![
        TaskStatus.ARCHIVED,
        TaskStatus.DELETED
    ].includes(task.status);
}

function percentage(completed, total) {
    return total > 0
        ? Math.round((completed / total) * 100)
        : null;
}

function toDate(value) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime())
        ? date
        : null;
}

function createPeriod(period, today) {
    const normalized = Object.hasOwn(PERIODS, period)
        ? period
        : "30";
    const days = PERIODS[normalized];

    if (days === null) {
        return {
            key: normalized,
            days,
            cutoff: null
        };
    }

    const cutoff = new Date(`${today}T00:00:00`);
    cutoff.setDate(cutoff.getDate() - days + 1);

    return {
        key: normalized,
        days,
        cutoff
    };
}

function isRecent(value, period) {
    if (!value) return false;
    if (!period.cutoff) return true;

    const date = toDate(value);
    return date ? date >= period.cutoff : false;
}

function getDaysAvailable(dueDate, today) {
    if (!dueDate) return null;

    const due = new Date(`${dueDate}T00:00:00`);
    const current = new Date(`${today}T00:00:00`);

    return Math.ceil(
        (due.getTime() - current.getTime()) /
        86400000
    );
}

function buildTaskMetric(tasks, today, period) {
    const unique = [
        ...new Map(
            tasks.map(task => [task.id, task])
        ).values()
    ];
    const completed = unique.filter(
        task => task.status === TaskStatus.COMPLETED
    );
    const pending = unique.filter(
        task => task.status !== TaskStatus.COMPLETED
    );
    const completedDates = completed
        .map(task => toDate(task.completedAt))
        .filter(Boolean)
        .sort((left, right) => right - left);

    return {
        taskIds: unique.map(task => task.id),
        total: unique.length,
        completed: completed.length,
        pending: pending.length,
        percentage: percentage(
            completed.length,
            unique.length
        ),
        overdue: pending.filter(
            task =>
                task.dueDate &&
                task.dueDate < today
        ).length,
        postponed: unique.filter(
            task =>
                Array.isArray(task.postponements) &&
                task.postponements.length > 0
        ).length,
        recentCompleted: completed.filter(
            task => isRecent(
                task.completedAt,
                period
            )
        ).length,
        lastAdvance:
            completedDates[0]?.toISOString() ?? null
    };
}

function collectDescendants(rootId, childrenByParent) {
    const descendants = [];
    const pending = [
        ...(childrenByParent.get(rootId) ?? [])
    ];
    const visited = new Set();

    while (pending.length > 0) {
        const task = pending.shift();

        if (!task || visited.has(task.id)) continue;

        visited.add(task.id);
        descendants.push(task);
        pending.push(
            ...(childrenByParent.get(task.id) ?? [])
        );
    }

    return descendants;
}

function collectGoalDescendants(rootId, goalsByParent) {
    const ids = [];
    const pending = [
        ...(goalsByParent.get(rootId) ?? [])
    ];
    const visited = new Set();

    while (pending.length > 0) {
        const goal = pending.shift();

        if (!goal || visited.has(goal.id)) continue;

        visited.add(goal.id);
        ids.push(goal.id);
        pending.push(
            ...(goalsByParent.get(goal.id) ?? [])
        );
    }

    return ids;
}

export function buildProgressStatistics({
    tasks = [],
    goals = [],
    period = "30",
    today = new Date().toISOString().slice(0, 10)
} = {}) {
    const selectedPeriod = createPeriod(
        String(period),
        today
    );
    const includedTasks = tasks.filter(
        isIncludedTask
    );
    const childrenByParent = new Map();

    for (const task of includedTasks) {
        if (!task.parentTaskId) continue;

        if (!childrenByParent.has(task.parentTaskId)) {
            childrenByParent.set(
                task.parentTaskId,
                []
            );
        }

        childrenByParent
            .get(task.parentTaskId)
            .push(task);
    }

    const descendantsByTask = new Map(
        includedTasks.map(task => [
            task.id,
            collectDescendants(
                task.id,
                childrenByParent
            )
        ])
    );

    const projects = includedTasks
        .map(task => ({
            task,
            descendants:
                descendantsByTask.get(task.id) ?? []
        }))
        .filter(item => item.descendants.length > 0)
        .map(({ task, descendants }) => ({
            id: task.id,
            title: task.title,
            ...buildTaskMetric(
                descendants,
                today,
                selectedPeriod
            )
        }))
        .sort((left, right) =>
            left.title.localeCompare(
                right.title,
                "es"
            )
        );

    const goalsByParent = new Map();

    for (const goal of goals) {
        if (!goal.parentGoalId) continue;

        if (!goalsByParent.has(goal.parentGoalId)) {
            goalsByParent.set(goal.parentGoalId, []);
        }

        goalsByParent
            .get(goal.parentGoalId)
            .push(goal);
    }

    const taskSetForGoal = goalId => {
        const included = new Map();
        const directTasks = includedTasks.filter(
            task => (task.goalIds ?? []).includes(goalId)
        );

        for (const task of directTasks) {
            const descendants =
                descendantsByTask.get(task.id) ?? [];

            if (descendants.length > 0) {
                for (const descendant of descendants) {
                    included.set(
                        descendant.id,
                        descendant
                    );
                }
            } else {
                included.set(task.id, task);
            }
        }

        return included;
    };

    const visibleGoals = goals.filter(
        goal => ![
            GoalStatus.ARCHIVED,
            GoalStatus.DELETED
        ].includes(goal.status)
    );

    const goalStatistics = visibleGoals
        .map(goal => {
            const ownTasks = taskSetForGoal(goal.id);
            const accumulatedTasks = new Map(ownTasks);
            const descendantGoalIds =
                collectGoalDescendants(
                    goal.id,
                    goalsByParent
                );

            for (const goalId of descendantGoalIds) {
                for (
                    const [taskId, task] of
                    taskSetForGoal(goalId)
                ) {
                    accumulatedTasks.set(
                        taskId,
                        task
                    );
                }
            }

            return {
                id: goal.id,
                title: goal.title,
                status: goal.status,
                dueDate: goal.dueDate,
                daysAvailable: getDaysAvailable(
                    goal.dueDate,
                    today
                ),
                subgoalCount:
                    descendantGoalIds.length,
                own: buildTaskMetric(
                    [...ownTasks.values()],
                    today,
                    selectedPeriod
                ),
                accumulated: buildTaskMetric(
                    [...accumulatedTasks.values()],
                    today,
                    selectedPeriod
                )
            };
        })
        .sort((left, right) =>
            left.title.localeCompare(
                right.title,
                "es"
            )
        );

    const panoramaTasks = new Map();

    for (const project of projects) {
        for (const taskId of project.taskIds) {
            const task = includedTasks.find(
                item => item.id === taskId
            );
            if (task) panoramaTasks.set(taskId, task);
        }
    }

    for (const goal of goalStatistics) {
        for (const taskId of goal.accumulated.taskIds) {
            const task = includedTasks.find(
                item => item.id === taskId
            );
            if (task) panoramaTasks.set(taskId, task);
        }
    }

    return {
        period: selectedPeriod.key,
        panorama: {
            ...buildTaskMetric(
                [...panoramaTasks.values()],
                today,
                selectedPeriod
            ),
            projects: projects.length,
            goals: goalStatistics.length
        },
        projects,
        goals: goalStatistics
    };
}
