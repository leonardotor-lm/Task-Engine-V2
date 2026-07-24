export function flattenTaskTree(tasks, expandedTaskIds = null) {

    const tasksById = new Map(
        tasks.map(task => [task.id, task])
    );

    const childrenByParent = new Map();

    for (const task of tasks) {

        if (
            task.parentTaskId &&
            tasksById.has(task.parentTaskId)
        ) {

            const children =
                childrenByParent.get(task.parentTaskId) ?? [];

            children.push(task);
            childrenByParent.set(task.parentTaskId, children);

        }

    }

    const roots = tasks.filter(task => {

        return (
            !task.parentTaskId ||
            !tasksById.has(task.parentTaskId)
        );

    });

    const result = [];
    const visited = new Set();

    const visit = (task, depth) => {

        if (visited.has(task.id)) return;

        visited.add(task.id);
        result.push({ task, depth });

        const children = childrenByParent.get(task.id) ?? [];

        const isExpanded =
            expandedTaskIds === null ||
            expandedTaskIds.has(task.id);

        if (!isExpanded) return;

        for (const child of children) {
            visit(child, depth + 1);
        }

    };

    for (const root of roots) {
        visit(root, 0);
    }

    for (const task of tasks) {
        visit(task, 0);
    }

    return result;

}
