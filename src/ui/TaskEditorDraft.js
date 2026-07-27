const normalizeTagIds = tagIds => {

    return [...(tagIds ?? [])]
        .map(String)
        .sort();

};

export function createTaskDraft(task) {

    if (!task) return null;

    return {
        title:
            (task.title ?? "").trim(),
        description:
            (task.description ?? "").trim(),
        areaId:
            task.areaId || null,
        contextId:
            task.contextId || null,
        priority:
            Number(task.priority ?? 0),
        dueDate:
            task.dueDate || null,
        tagIds:
            normalizeTagIds(task.tagIds),
        recurrence:
            task.recurrence || null
    };

}

export function readTaskEditorDraft(
    root = document
) {

    const title =
        root.querySelector(
            "#taskTitleEdit"
        );

    if (!title) return null;

    return {
        title:
            title.value.trim(),
        description:
            root.querySelector(
                "#taskDescriptionEdit"
            ).value.trim(),
        areaId:
            root.querySelector(
                "#taskArea"
            ).value || null,
        contextId:
            root.querySelector(
                "#taskContext"
            ).value || null,
        priority:
            Number(
                root.querySelector(
                    "#taskPriority"
                ).value
            ),
        dueDate:
            root.querySelector(
                "#taskDueDate"
            ).value || null,
        tagIds:
            normalizeTagIds(
                [
                    ...root.querySelectorAll(
                        ".taskTag:checked"
                    )
                ].map(
                    input => input.value
                )
            ),
        recurrence:
            root.querySelector(
                "#taskRecurrence"
            ).value || null
    };

}

export function taskDraftsEqual(
    first,
    second
) {

    return JSON.stringify(first) ===
        JSON.stringify(second);

}

export function hasTaskEditorChanges(
    task,
    root = document
) {

    const editorDraft =
        readTaskEditorDraft(root);

    if (!editorDraft) {
        return false;
    }

    return !taskDraftsEqual(
        createTaskDraft(task),
        editorDraft
    );

}
