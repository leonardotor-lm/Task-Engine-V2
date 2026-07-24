export function normalizeSearchText(value = "") {

    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}

export function filterTasksByQuery(tasks, query) {

    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
        return [...tasks];
    }

    return tasks.filter(task => {

        const searchableText = normalizeSearchText(
            `${task.title ?? ""} ${task.description ?? ""}`
        );

        return searchableText.includes(normalizedQuery);

    });

}

export function filterTaskTreeByQuery(tasks, query) {

    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
        return [...tasks];
    }

    const tasksById = new Map(
        tasks.map(task => [task.id, task])
    );

    const includedIds = new Set();

    for (const task of tasks) {

        const searchableText = normalizeSearchText(
            `${task.title ?? ""} ${task.description ?? ""}`
        );

        if (!searchableText.includes(normalizedQuery)) {
            continue;
        }

        let currentTask = task;

        while (
            currentTask &&
            !includedIds.has(currentTask.id)
        ) {

            includedIds.add(currentTask.id);

            currentTask = tasksById.get(
                currentTask.parentTaskId
            );

        }

    }

    return tasks.filter(task => includedIds.has(task.id));

}
