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
