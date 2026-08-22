import { Task } from "../../src/domain/Task.js";

const TRACKED_FIELDS = [
    "priority",
    "dueDate",
    "isWaiting",
    "areaId",
    "contextId",
    "tagIds"
];

function cloneValue(value) {
    return Array.isArray(value)
        ? [...value]
        : value;
}

function diffTrackedFields(before, after) {
    const changes = {};

    for (const field of TRACKED_FIELDS) {
        const previous = before[field];
        const next = after[field];
        const equal = Array.isArray(previous) || Array.isArray(next)
            ? JSON.stringify(previous ?? []) === JSON.stringify(next ?? [])
            : previous === next;

        if (!equal) {
            changes[field] = cloneValue(next);
        }
    }

    return changes;
}

export function createAtomicTaskServiceFixture(taskData = []) {
    const tasks = new Map(
        taskData.map(data => {
            const task = new Task(data);
            return [task.id, task];
        })
    );
    const updates = [];

    const repository = {
        getById(id) {
            return tasks.get(id) || null;
        },
        getAll() {
            return [...tasks.values()];
        },
        updateMany(nextTasks) {
            for (const next of nextTasks) {
                const current = tasks.get(next.id);
                if (!current) {
                    throw new Error("La tarea no existe.");
                }

                const before = current.toJSON();
                Object.assign(current, next);
                const changes = diffTrackedFields(
                    before,
                    current.toJSON()
                );
                updates.push({ id: current.id, changes });
            }
        },
        replaceAll(nextTasks) {
            const replacements = new Map(
                nextTasks.map(task => [task.id, task])
            );

            for (const [id, current] of tasks) {
                const replacement = replacements.get(id);
                if (replacement) {
                    Object.assign(current, replacement);
                }
            }
        }
    };

    const taskService = {
        repository,
        activityService: null,
        getTaskById(id) {
            return repository.getById(id);
        }
    };

    return {
        tasks,
        updates,
        taskService
    };
}
