const normalizeTagIds = tagIds => {

    return [...(tagIds ?? [])]
        .map(String)
        .sort();

};

const normalizeGoalIds = goalIds => {

    return [...(goalIds ?? [])]
        .map(String)
        .sort();

};

const normalizeWeekdays = weekdays => {

    return [...(weekdays ?? [])]
        .map(Number)
        .sort(
            (first, second) =>
                first - second
        );

};

export function createTaskDraft(task) {

    if (!task) return null;

    const recurrence =
        task.recurrence || null;

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
        startDate:
            task.startDate || null,
        dueDate:
            task.dueDate || null,
        dueTime:
            task.dueTime || null,
        tagIds:
            normalizeTagIds(task.tagIds),
        goalIds:
            normalizeGoalIds(task.goalIds),
        recurrence,
        recurrenceInterval:
            recurrence
                ? Number(
                    task.recurrenceInterval ??
                    1
                )
                : 1,
        recurrenceWeekdays:
            recurrence === "WEEKLY"
                ? normalizeWeekdays(
                    task.recurrenceWeekdays
                )
                : []
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

    const recurrence =
        root.querySelector(
            "#taskRecurrence"
        ).value || null;

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
        startDate:
            root.querySelector(
                "#taskStartDate"
            )?.value || null,
        dueDate:
            root.querySelector(
                "#taskDueDate"
            ).value || null,
        dueTime:
            root.querySelector(
                "#taskDueTime"
            )?.value || null,
        tagIds:
            normalizeTagIds(
                [
                    ...root.querySelectorAll(
                        ".taskTag"
                    )
                ].map(
                    input => input.value
                )
            ),
        goalIds:
            normalizeGoalIds(
                [
                    ...root.querySelectorAll(
                        ".taskGoal"
                    )
                ].map(
                    input => input.value
                )
            ),
        recurrence,
        recurrenceInterval:
            recurrence
                ? Number(
                    root.querySelector(
                        "#taskRecurrenceInterval"
                    ).value
                )
                : 1,
        recurrenceWeekdays:
            recurrence === "WEEKLY"
                ? normalizeWeekdays(
                    [
                        ...root
                            .querySelectorAll(
                                ".taskRecurrenceWeekday:checked"
                            )
                    ].map(
                        input =>
                            input.value
                    )
                )
                : []
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
