function sameParent(first, second) {
    return (first?.parentTaskId ?? null) ===
        (second?.parentTaskId ?? null);
}

function effectiveParentId(task, visibleIds = null) {
    const parentId = task?.parentTaskId ?? null;

    if (!visibleIds || !parentId) {
        return parentId;
    }

    return visibleIds.has(parentId)
        ? parentId
        : null;
}

function sameVisibleLevel(first, second, visibleIds) {
    return effectiveParentId(first, visibleIds) ===
        effectiveParentId(second, visibleIds);
}

function compareManual(first, second, positions) {
    const difference =
        (first.manualOrder ?? 0) -
        (second.manualOrder ?? 0);

    if (difference !== 0) return difference;

    const dateDifference = String(
        first.createdAt ?? ""
    ).localeCompare(
        String(second.createdAt ?? "")
    );

    return dateDifference ||
        positions.get(first.id) -
        positions.get(second.id);
}

export function reorderTaskAmongSiblings(
    taskService,
    draggedId,
    targetId,
    placement = "before",
    visibleTaskIds = null
) {
    if (!taskService || draggedId === targetId) {
        return false;
    }

    const dragged = taskService.getTaskById?.(
        draggedId
    );
    const target = taskService.getTaskById?.(
        targetId
    );
    const visibleIds = Array.isArray(visibleTaskIds)
        ? new Set(visibleTaskIds)
        : null;
    const sameLevel = visibleIds
        ? sameVisibleLevel(
            dragged,
            target,
            visibleIds
        )
        : sameParent(dragged, target);

    if (!dragged || !target || !sameLevel) {
        return false;
    }

    const allTasks =
        taskService.getAllTasks?.() ?? [];
    const positions = new Map(
        allTasks.map((task, index) => [
            task.id,
            index
        ])
    );
    const siblings = allTasks
        .filter(task => {
            if (visibleIds) {
                return (
                    visibleIds.has(task.id) &&
                    sameVisibleLevel(
                        task,
                        dragged,
                        visibleIds
                    )
                );
            }

            return sameParent(task, dragged);
        })
        .sort((first, second) =>
            compareManual(
                first,
                second,
                positions
            )
        );

    const draggedIndex = siblings.findIndex(
        task => task.id === draggedId
    );

    if (draggedIndex < 0) return false;

    const [moved] = siblings.splice(
        draggedIndex,
        1
    );
    const targetIndex = siblings.findIndex(
        task => task.id === targetId
    );

    if (targetIndex < 0) return false;

    const insertionIndex =
        placement === "after"
            ? targetIndex + 1
            : targetIndex;

    siblings.splice(
        insertionIndex,
        0,
        moved
    );

    const changed = [];

    siblings.forEach((task, index) => {
        if (task.manualOrder === index) {
            return;
        }

        task.manualOrder = index;
        task.touch?.();
        changed.push(task);
    });

    if (changed.length === 0) {
        return false;
    }

    taskService.repository?.updateMany?.(
        changed
    );

    return true;
}
